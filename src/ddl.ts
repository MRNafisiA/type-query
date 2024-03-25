import { Table } from './Table';
import { Dictionary } from './keywords';

const generateCreateSequencesSQL = (table: Table) => {
    const queries = [];
    for (const [key, column] of Object.entries(table.columns)) {
        if (
            (column as unknown as Record<'defaultValue', ['auto-increment']>)
                .defaultValue?.[0] !== 'auto-increment'
        ) {
            continue;
        }

        const tokens = [
            `CREATE SEQUENCE ${getSequenceName(table.schemaName, table.tableName, key, column)}`
        ];
        switch (column.type as 'int2' | 'int4') {
            case 'int2':
                tokens.push('AS SMALLINT');
                break;
            case 'int4':
                tokens.push('AS INTEGER');
                break;
        }

        queries.push(tokens.join(' '));
    }
    return queries;
};

const generateDropSequencesSQL = (table: Table) => {
    const queries = [];
    for (const [key, column] of Object.entries(table.columns)) {
        if (
            (column as unknown as Record<'defaultValue', ['auto-increment']>)
                .defaultValue?.[0] !== 'auto-increment'
        ) {
            continue;
        }

        queries.push(
            `DROP SEQUENCE ${getSequenceName(table.schemaName, table.tableName, key, column)}`
        );
    }
    return queries;
};

const generateCreateTableSQL = (table: Table) => {
    // columns
    const columnsAsEntries = Object.entries(table.columns);
    const columns = columnsAsEntries.map(([key, column]) => {
        const tokens = [
            `"${column.title ?? key}" ${Dictionary.PostgresType[column.type]}`
        ];

        // default
        if (column.default) {
            const defaultValue = (
                column as unknown as {
                    defaultValue:
                        | ['auto-increment']
                        | ['created-at']
                        | ['updated-at']
                        | ['sql', string]
                        | ['js', unknown];
                }
            ).defaultValue;
            switch (defaultValue[0]) {
                case 'auto-increment':
                    tokens.push(
                        `DEFAULT NEXTVAL('${getSequenceName(table.schemaName, table.tableName, key, column)}'::REGCLASS)`
                    );
                    break;
                case 'sql':
                    tokens.push(`DEFAULT ${defaultValue[1]}`);
                    break;
            }
        }

        // nullable
        tokens.push(column.nullable ? 'NULL' : 'NOT NULL');

        // reference
        if (column.reference !== undefined) {
            tokens.push(
                `REFERENCES "${column.reference.table.schemaName}"."${column.reference.table.tableName}"` +
                    `("${
                        column.reference.table.columns[column.reference.column]
                            .title ?? column.reference.column
                    }") ` +
                    `ON UPDATE ${
                        Dictionary.ReferenceAction[
                            column.reference.onUpdate ?? 'no-action'
                        ]
                    } ON DELETE ${Dictionary.ReferenceAction[column.reference.onDelete ?? 'no-action']}`
            );
        }

        return tokens.join(' ');
    });

    // constraints
    const constraints = [];
    const primaryKeys = columnsAsEntries.filter(
        ([, column]) => !column.nullable && column.primary
    );
    if (primaryKeys.length !== 0) {
        constraints.push(
            `CONSTRAINT "${table.tableName}_pk" PRIMARY KEY(${primaryKeys
                .map(([key, column]) => `"${column.title ?? key}"`)
                .join(', ')})`
        );
    }

    return `CREATE TABLE "${table.schemaName}"."${table.tableName}"(${[...columns, ...constraints].join(', ')})`;
};

const generateDropTableSQL = (table: Table) =>
    `DROP TABLE "${table.schemaName}"."${table.tableName}"`;

const getSequenceName = (
    schemaName: string,
    tableName: string,
    columnKey: string,
    column: {
        title?: string;
        sequenceTitle?: string;
    }
) =>
    `"${schemaName}"."` +
    (column.sequenceTitle ??
        tableName + '_' + (column.title ?? columnKey) + '_seq') +
    '"';

export {
    generateCreateSequencesSQL,
    generateDropSequencesSQL,
    generateCreateTableSQL,
    generateDropTableSQL,
    getSequenceName
};
