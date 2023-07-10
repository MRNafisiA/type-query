import type { ClientBase } from 'pg';
import type { Table } from './types/Table';
import { err, ok, type Result } from 'never-catch';
import { toPostgresType, toReferenceAction } from './dictionary';

const createTables = (tables: Table[], resolve: boolean = true) => {
    // resolve
    if (resolve) {
        const dependencyResult = resolveTablesDependency(tables);
        if (!dependencyResult.ok) {
            return err(`<create-tables> -> resolve dependency -> ${dependencyResult.error}`);
        }
        tables = dependencyResult.value;
    }

    // SQLs
    const sequencesSQL = tables.map(table => createSequencesSQL(table)).flat();
    const tablesSQL = tables.map(table => createTableSQL(table));

    return ok({
        getData: () => ({ sequencesSQL, tablesSQL }),
        exec: async (client: ClientBase): Promise<Result<undefined, string | { db: unknown; query: string }>> => {
            // create sequences
            for (const sequenceSQL of sequencesSQL) {
                const result = await client
                    .query(sequenceSQL)
                    .then(() => true as const)
                    .catch(e => ({ db: e, query: sequenceSQL }));
                if (result !== true) {
                    return err(result);
                }
            }

            // create tables
            for (const tableSQL of tablesSQL) {
                const result = await client
                    .query(tableSQL)
                    .then(() => true as const)
                    .catch(e => ({ db: e, query: tableSQL }));
                if (result !== true) {
                    return err(result);
                }
            }

            return Promise.resolve(ok(undefined));
        }
    });
};

const dropTables = (tables: Table[], resolve: boolean = true) => {
    // resolve
    if (resolve) {
        const dependencyResult = resolveTablesDependency(tables);
        if (!dependencyResult.ok) {
            return err(`<drop-tables> -> resolve dependency -> ${dependencyResult.error}`);
        }
        tables = dependencyResult.value.reverse();
    }

    // SQLs
    const tablesSQL = tables.map(table => dropTableSQL(table));
    const sequencesSQL = tables.map(table => dropSequencesSQL(table)).flat();

    return ok({
        getData: () => ({
            tablesSQL,
            sequencesSQL
        }),
        exec: async (client: ClientBase): Promise<Result<undefined, string | { db: unknown; query: string }>> => {
            // drop tables
            for (const tableSQL of tablesSQL) {
                const result = await client
                    .query(tableSQL)
                    .then(() => true as const)
                    .catch(e => ({ db: e, query: tableSQL }));
                if (result !== true) {
                    return err(result);
                }
            }

            // drop sequences
            for (const sequenceSQL of sequencesSQL) {
                const result = await client
                    .query(sequenceSQL)
                    .then(() => true as const)
                    .catch(e => ({ db: e, query: sequenceSQL }));
                if (result !== true) {
                    return err(result);
                }
            }

            return Promise.resolve(ok(undefined));
        }
    });
};

const resolveTablesDependency = (tables: Table[]): Result<Table[], string> => {
    const allTablesAndDependenciesResult = getAllTablesAndDependencies(tables);
    if (!allTablesAndDependenciesResult.ok) {
        return allTablesAndDependenciesResult;
    }
    let [allTables, dependencies] = allTablesAndDependenciesResult.value;

    const result = [];
    while (allTables.length !== 0) {
        // find all independent tables
        const independentTables: Table[] = [];
        for (const table of allTables) {
            if (dependencies.find(v => v.parent === table) === undefined) {
                independentTables.push(table);
            }
        }

        // remove founded tables from all tables and add them to the result
        for (const independentTable of independentTables) {
            allTables.splice(allTables.indexOf(independentTable), 1);
        }
        result.push(...independentTables);

        // remove dependencies depend on founded tables
        dependencies = dependencies.filter(v => !independentTables.includes(v.child));

        // do it again ...
    }
    return ok(result);
};

const getAllTablesAndDependencies = (tables: Table[]): Result<[Table[], { parent: Table; child: Table }[]], string> => {
    const allTables = [...tables];
    const dependencies = [];
    for (const table of allTables) {
        for (const [_, column] of Object.entries(table.columns)) {
            // skip independent tables
            if (column.reference === undefined) {
                continue;
            }

            // skip repeated tables
            if (!allTables.includes(column.reference.table)) {
                allTables.push(column.reference.table);
            }

            // add new dependency if it is not repeated
            if (dependencies.find(v => v.parent === table && v.child === column.reference?.table) === undefined) {
                dependencies.push({ parent: table, child: column.reference.table });
            }

            // check bidirectional dependency
            for (const dependency of dependencies) {
                if (dependency.parent === column.reference.table && dependency.child === table) {
                    return err(
                        `bidirectional dependency detected "${table.schema}"."${table.title}" and "${column.reference.table.schema}"."${column.reference.table.title}"`
                    );
                }
            }
        }
    }

    return ok([allTables, dependencies]);
};

const createSequencesSQL = (table: Table) => {
    const queries = [];
    for (const [key, column] of Object.entries(table.columns)) {
        // skip tables without sequences
        if (column.default !== 'auto-increment') {
            continue;
        }

        // build query
        const tokens = [`CREATE SEQUENCE ${getSequenceName(table.schema, table.title, key, column)}`];
        if (column.type === 'smallint') {
            tokens.push('as smallint');
        } else if (column.type === 'integer') {
            tokens.push('as integer');
        }
        tokens.push(';');

        // add query to the result
        queries.push(tokens.join(' '));
    }
    return queries;
};

const dropSequencesSQL = (table: Table) => {
    const queries = [];
    for (const [key, column] of Object.entries(table.columns)) {
        // skip tables without sequences
        if (column.default !== 'auto-increment') {
            continue;
        }

        // add query to the result
        queries.push(`DROP SEQUENCE ${getSequenceName(table.schema, table.title, key, column)} ;`);
    }
    return queries;
};

const createTableSQL = (table: Table) => {
    const tokens = [`CREATE TABLE "${table.schema}"."${table.title}"(`];

    // columns clause
    const columnsAsEntries = Object.entries(table.columns);
    const columns = columnsAsEntries.map(([key, column]) => {
        const tokens = [`"${column.title ?? key}" ${toPostgresType(column.type)}`];

        // add default clause
        if (column.default === 'auto-increment') {
            tokens.push(`DEFAULT nextVal( '${getSequenceName(table.schema, table.title, key, column)}'::regClass )`);
        } else if (column.default === true) {
            tokens.push(`DEFAULT ${column.value}`);
        }

        // add not null-null clause
        tokens.push(column.nullable ? 'NULL' : 'NOT NULL');

        // add referencing clause
        if (column.reference !== undefined) {
            tokens.push(
                `REFERENCES "${column.reference.table.schema}"."${column.reference.table.title}"` +
                    `( "${
                        column.reference.table.columns[column.reference.column].title ?? column.reference.column
                    }" ) ` +
                    `ON UPDATE ${toReferenceAction(
                        column.reference.onUpdate ?? 'no-action'
                    )} ON DELETE ${toReferenceAction(column.reference.onDelete ?? 'no-action')}`
            );
        }
        return tokens.join(' ');
    });

    // constraints clause
    const constraints = [];
    const primaryKeys = columnsAsEntries.filter(([_, column]) => !column.nullable && column.primary);
    if (primaryKeys.length !== 0) {
        constraints.push(
            `CONSTRAINT "${table.title}_pk" PRIMARY KEY( ${primaryKeys
                .map(([key, column]) => `"${column.title ?? key}"`)
                .join(', ')} )`
        );
    }

    // add columns and constrains union
    const columnsAndConstraints = [...columns, ...constraints];
    if (columnsAndConstraints.length !== 0) {
        tokens.push(columnsAndConstraints.join(', '));
    }

    tokens.push(') ;');
    return tokens.join(' ');
};

const dropTableSQL = (table: Table) => `DROP TABLE "${table.schema}"."${table.title}" ;`;

const getSequenceName = (
    tableSchema: string,
    tableTitle: string,
    columnKey: string,
    column: { title?: string; seqTitle?: string }
) => `"${tableSchema}"."` + (column.seqTitle ?? tableTitle + '_' + (column.title ?? columnKey) + '_seq') + '"';

export {
    createTables,
    dropTables,
    resolveTablesDependency,
    getAllTablesAndDependencies,
    createSequencesSQL,
    dropSequencesSQL,
    createTableSQL,
    dropTableSQL,
    getSequenceName
};
