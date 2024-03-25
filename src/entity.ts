import * as U from './utils';
import { ClientBase } from 'pg';
import { Dictionary } from './keywords';
import { err, ok, Result } from 'never-catch';
import { Context, createContext } from './context';
import { NullableType, Schema, Table } from './Table';
import {
    resolveColumn,
    resolveExpression,
    resolveResult,
    resolveReturning
} from './resolve';

const createEntity = <S extends Schema = Schema>(table: Table<S>) => ({
    table,
    context: createContext(table),
    select: function <
        R extends readonly (
            | (keyof S & string)
            | CustomColumn<unknown, string>
        )[]
    >(
        returning: R | ((context: Context<S>) => R),
        where: boolean | ((context: Context<S>) => boolean),
        options = {} as SelectOptions<S>
    ): Query<S, R> {
        return createQuery(params =>
            createSelectQuery(
                this.context,
                table as Table,
                returning as
                    | ReturningRows
                    | ((context: Context) => ReturningRows),
                where as boolean | ((context: Context) => boolean),
                options as SelectOptions,
                params
            )
        );
    },
    insert: function <
        R extends readonly (
            | (keyof S & string)
            | CustomColumn<unknown, string>
        )[],
        N extends readonly (keyof NullableAndDefaultColumns<S>)[] = []
    >(
        rows:
            | InsertingRow<S, N>[]
            | ((context: Context<S>) => InsertingRow<S, N>[]),
        returning: R | ((context: Context<S>) => R),
        options = {} as InsertOptions<S, N>
    ): Query<S, R> {
        return createQuery(params =>
            createInsertQuery(
                this.context,
                table as Table,
                rows as
                    | Record<string, unknown>[]
                    | ((context: Context) => Record<string, unknown>[]),
                returning as
                    | ReturningRows
                    | ((context: Context) => ReturningRows),
                options as InsertOptions<Schema, readonly string[]>,
                params
            )
        );
    },
    update: function <
        R extends readonly (
            | (keyof S & string)
            | CustomColumn<unknown, string>
        )[]
    >(
        sets: UpdateSets<S> | ((context: Context<S>) => UpdateSets<S>),
        where: boolean | ((context: Context<S>) => boolean),
        returning: R | ((context: Context<S>) => R)
    ): Query<S, R> {
        return createQuery(params =>
            createUpdateQuery(
                this.context,
                table as Table,
                sets as UpdateSets | ((context: Context) => UpdateSets),
                where as boolean | ((context: Context) => boolean),
                returning as
                    | ReturningRows
                    | ((context: Context) => ReturningRows),
                params
            )
        );
    },
    delete: function <
        R extends readonly (
            | (keyof S & string)
            | CustomColumn<unknown, string>
        )[]
    >(
        where: boolean | ((context: Context<S>) => boolean),
        returning: R | ((context: Context<S>) => R)
    ): Query<S, R> {
        return createQuery(params =>
            createDeleteQuery(
                this.context,
                table as Table,
                returning as
                    | ReturningRows
                    | ((context: Context) => ReturningRows),
                where as boolean | ((context: Context) => boolean),
                params
            )
        );
    },
    join: function <MA extends string, JS extends Schema, JA extends string>(
        mainAlias: MA,
        joinType: JoinType,
        joinTable: Table<JS>,
        joinAlias: JA,
        on:
            | boolean
            | ((
                  contexts: SchemaMapContexts<Record<MA, S> & Record<JA, JS>>
              ) => boolean)
    ): JoinEntity<
        Record<MA, S> & Record<JA, JS>,
        PrefixAliasOnSchema<S, MA> & PrefixAliasOnSchema<JS, JA>
    > {
        return createJoinSelectEntity<
            Record<MA, S> & Record<JA, JS>,
            PrefixAliasOnSchema<S, MA> & PrefixAliasOnSchema<JS, JA>
        >(
            { table: table as Table, alias: mainAlias },
            [
                {
                    table: joinTable as Table,
                    joinType,
                    alias: joinAlias,
                    on: on as
                        | boolean
                        | ((contexts: Record<string, Context>) => boolean)
                }
            ],
            {
                [`${mainAlias}Context`]: createContext(table, mainAlias),
                [`${joinAlias}Context`]: createContext(joinTable, joinAlias)
            } as unknown as SchemaMapContexts<Record<MA, S> & Record<JA, JS>>
        );
    }
});

// select
type SelectOptions<S extends Schema = Schema> = {
    distinct?: true | (keyof S & string)[];
    groupBy?: unknown[] | ((context: Context<S>) => unknown[]);
    orders?: {
        by: keyof S & string;
        direction: OrderDirection;
    }[];
    start?: bigint;
    step?: number;
};

const createSelectQuery = (
    context: Context,
    table: Table,
    returning: ReturningRows | ((context: Context) => ReturningRows),
    where: boolean | ((context: Context) => boolean),
    options: SelectOptions,
    params: string[]
): Result<QueryData, string> => {
    const errorPrefix = `select("${table.schemaName}"."${table.tableName}")`;
    const {
        distinct = false,
        groupBy = [],
        orders = [],
        start,
        step
    } = options;
    const tokens = ['SELECT'];

    // distinct
    if (distinct === true) {
        tokens.push('DISTINCT');
    } else if (Array.isArray(distinct)) {
        tokens.push(
            `DISTINCT ON(${distinct.map(column => resolveColumn(table, column, false)).join(', ')})`
        );
    }

    // select
    const _returning =
        typeof returning === 'function' ? returning(context) : returning;
    const resolvedReturning = resolveReturning(
        column => [table.columns[column].title, undefined],
        _returning,
        params.length + 1
    );
    if (!resolvedReturning.ok) {
        return err(`${errorPrefix} -> ${resolvedReturning.error}`);
    }
    params.push(...resolvedReturning.value.params);
    tokens.push(resolvedReturning.value.text);

    // from
    tokens.push(`FROM "${table.schemaName}"."${table.tableName}"`);

    // where
    const resolvedWhereResult = resolveExpression(
        typeof where === 'function' ? where(context) : where,
        params.length + 1,
        false
    );
    if (!resolvedWhereResult.ok) {
        return err(`${errorPrefix} -> where -> ${resolvedWhereResult.error}`);
    }
    if (resolvedWhereResult.value.text === '') {
        return err(`${errorPrefix} -> where -> neutral`);
    }
    params.push(...resolvedWhereResult.value.params);
    tokens.push('WHERE', resolvedWhereResult.value.text);

    // groupBy
    const _groupBy = typeof groupBy === 'function' ? groupBy(context) : groupBy;
    if (_groupBy.length !== 0) {
        const groupByTextArray = [];
        for (const aGroupBy of _groupBy) {
            const resolvedGroupBy = resolveExpression(
                aGroupBy,
                params.length + 1,
                false
            );
            if (!resolvedGroupBy.ok) {
                return err(
                    `${errorPrefix} -> groupBy -> ${_groupBy.indexOf(aGroupBy)} -> ${resolvedGroupBy.error}`
                );
            }
            params.push(...resolvedGroupBy.value.params);
            groupByTextArray.push(resolvedGroupBy.value.text);
        }
        tokens.push('GROUP BY', groupByTextArray.join(', '));
    }

    // orders
    if (orders.length !== 0) {
        const ordersTextArray = [];
        for (const order of orders) {
            const { by, direction } = order;
            ordersTextArray.push(
                `${resolveColumn(table, by, false)} ${Dictionary.OrderDirection[direction]}`
            );
        }
        tokens.push('ORDER BY', ordersTextArray.join(', '));
    }

    // pagination
    if (start !== undefined) {
        if (start < 0) {
            return err(`${errorPrefix} -> start -> invalid`);
        }
        tokens.push('OFFSET', start.toString());
    }
    if (step !== undefined) {
        if (step <= 0) {
            return err(`${errorPrefix} -> step -> invalid`);
        }
        tokens.push('LIMIT', step.toString());
    }

    return ok({ sql: tokens.join(' '), params });
};

// insert
type InsertOptions<
    S extends Schema,
    N extends readonly (keyof NullableAndDefaultColumns<S>)[]
> = {
    nullableDefaultColumns?: N;
};
type InsertingRow<
    S extends Schema,
    N extends readonly (keyof NullableAndDefaultColumns<S>)[]
> = {
    [key in Exclude<
        keyof S,
        keyof NullableAndDefaultColumns<S>
    >]: S[key]['type'];
} & {
    [key in Exclude<keyof N, keyof never[]> as N[key] & string]?: NullableType<
        S[N[key] & string]['type'],
        S[N[key] & string]['nullable']
    >;
};

const createInsertQuery = (
    context: Context,
    table: Table,
    rows:
        | Record<string, unknown>[]
        | ((context: Context) => Record<string, unknown>[]),
    returning: ReturningRows | ((context: Context) => ReturningRows),
    options: InsertOptions<Schema, readonly string[]>,
    params: string[]
): Result<QueryData, string> => {
    const errorPrefix = `insert("${table.schemaName}"."${table.tableName}")`;
    const { nullableDefaultColumns = [] } = options;
    const tokens = [`INSERT INTO "${table.schemaName}"."${table.tableName}"`];

    // columns
    const insertingColumns: string[] = [];
    const columnsTextArray = [];
    for (const column in table.columns) {
        if (
            nullableDefaultColumns.includes(column) ||
            !table.columns[column].nullable ||
            table.columns[column].default
        ) {
            insertingColumns.push(column);
            columnsTextArray.push(resolveColumn(table, column, false));
        }
    }
    tokens.push(`(${columnsTextArray.join(', ')})`, 'VALUES');

    // rows
    const rowsTextArray: string[] = [];
    const _rows = typeof rows === 'function' ? rows(context) : rows;
    if (_rows.length === 0) {
        return err(`${errorPrefix} -> rows -> empty`);
    }
    for (const _row of _rows) {
        const rowTokens = [];
        for (const insertingColumn of insertingColumns) {
            if (_row[insertingColumn] === undefined) {
                const column = table.columns[insertingColumn] as unknown as {
                    nullable: boolean;
                    defaultValue:
                        | undefined
                        | ['auto-increment']
                        | ['created-at']
                        | ['updated-at']
                        | ['sql', string]
                        | ['js', unknown];
                };
                if (column.defaultValue !== undefined) {
                    switch (column.defaultValue[0]) {
                        case 'auto-increment':
                            rowTokens.push('DEFAULT');
                            continue;
                        case 'created-at':
                        case 'updated-at':
                            rowTokens.push(U.stringify(new Date(), true));
                            continue;
                        case 'sql':
                            rowTokens.push(column.defaultValue[1]);
                            continue;
                        case 'js':
                            rowTokens.push(
                                U.stringify(column.defaultValue[1], true)
                            );
                            continue;
                    }
                }
                if (column.nullable) {
                    rowTokens.push(U.stringify(null, true));
                    continue;
                }
                return err(
                    `${errorPrefix} -> rows -> ${_rows.indexOf(_row)} -> ${insertingColumn} -> no-value`
                );
            } else {
                const resolvedExpressionResult = resolveExpression(
                    _row[insertingColumn],
                    params.length + 1,
                    false
                );
                if (!resolvedExpressionResult.ok) {
                    return err(
                        `${errorPrefix} -> rows -> ${_rows.indexOf(_row)}][${insertingColumn} -> ${
                            resolvedExpressionResult.error
                        }`
                    );
                }
                if (resolvedExpressionResult.value.text === '') {
                    return err(
                        `${errorPrefix} -> rows -> ${_rows.indexOf(_row)}][${insertingColumn} -> neutral`
                    );
                }
                params.push(...resolvedExpressionResult.value.params);
                rowTokens.push(resolvedExpressionResult.value.text);
            }
        }
        rowsTextArray.push(`(${rowTokens.join(', ')})`);
    }
    tokens.push(rowsTextArray.join(', '));

    // returning
    const _returning =
        typeof returning === 'function' ? returning(context) : returning;
    if (_returning.length !== 0) {
        const resolvedReturning = resolveReturning(
            column => [table.columns[column].title, undefined],
            _returning,
            params.length + 1
        );
        if (!resolvedReturning.ok) {
            return err(`${errorPrefix} -> ${resolvedReturning.error}`);
        }
        params.push(...resolvedReturning.value.params);
        tokens.push('RETURNING', resolvedReturning.value.text);
    }

    return ok({ sql: tokens.join(' '), params });
};

// update
type UpdateSets<S extends Schema = Schema> = {
    [key in keyof S]?: NullableType<S[key]['type'], S[key]['nullable']>;
};

const createUpdateQuery = (
    context: Context,
    table: Table,
    sets: UpdateSets | ((context: Context) => UpdateSets),
    where: boolean | ((context: Context) => boolean),
    returning: ReturningRows | ((context: Context) => ReturningRows),
    params: string[]
): Result<QueryData, string> => {
    const errorPrefix = `update("${table.schemaName}"."${table.tableName}")`;
    const tokens = [`UPDATE "${table.schemaName}"."${table.tableName}" SET`];

    // set
    const _set = typeof sets === 'function' ? sets(context) : sets;
    const setsTextArray = [];
    let key: keyof typeof _set & string;
    for (key in _set) {
        if (_set[key] === undefined) {
            continue;
        }
        const setExpressionResult = resolveExpression(
            _set[key],
            params.length + 1,
            false
        );
        if (!setExpressionResult.ok) {
            return err(
                `${errorPrefix} -> sets -> ${key} -> ${setExpressionResult.error}`
            );
        }
        if (setExpressionResult.value.text === '') {
            return err(`${errorPrefix} -> sets -> ${key} -> neutral`);
        }
        params.push(...setExpressionResult.value.params);
        setsTextArray.push(
            `${resolveColumn(table, key, false)} = ${setExpressionResult.value.text}`
        );
    }
    for (const column in table.columns) {
        switch (
            (
                table.columns[column] as unknown as {
                    defaultValue: undefined | ['updated-at'];
                }
            ).defaultValue?.[0]
        ) {
            case 'updated-at':
                setsTextArray.push(
                    `${resolveColumn(table, column, false)} = ${U.stringify(new Date(), true)}`
                );
                break;
        }
    }
    if (setsTextArray.length === 0) {
        return err(`${errorPrefix} -> sets -> empty`);
    }
    tokens.push(setsTextArray.join(', '));

    // where
    const resolvedWhereResult = resolveExpression(
        typeof where === 'function' ? where(context) : where,
        params.length + 1,
        false
    );
    if (!resolvedWhereResult.ok) {
        return err(`${errorPrefix} -> where -> ${resolvedWhereResult.error}`);
    }
    if (resolvedWhereResult.value.text === '') {
        return err(`${errorPrefix} -> where -> neutral`);
    }
    params.push(...resolvedWhereResult.value.params);
    tokens.push('WHERE', resolvedWhereResult.value.text);

    // returning
    const _returning =
        typeof returning === 'function' ? returning(context) : returning;
    if (_returning.length !== 0) {
        const resolvedReturning = resolveReturning(
            column => [table.columns[column].title, undefined],
            _returning,
            params.length + 1
        );
        if (!resolvedReturning.ok) {
            return err(`${errorPrefix} -> ${resolvedReturning.error}`);
        }
        params.push(...resolvedReturning.value.params);
        tokens.push('RETURNING', resolvedReturning.value.text);
    }

    return ok({ sql: tokens.join(' '), params });
};

// delete
const createDeleteQuery = (
    context: Context,
    table: Table,
    returning: ReturningRows | ((context: Context) => ReturningRows),
    where: boolean | ((context: Context) => boolean),
    params: string[]
): Result<QueryData, string> => {
    const tokens = [`DELETE FROM "${table.schemaName}"."${table.tableName}"`];

    // where
    const resolvedWhereResult = resolveExpression(
        typeof where === 'function' ? where(context) : where,
        params.length + 1,
        false
    );
    if (!resolvedWhereResult.ok) {
        return err(
            `delete("${table.schemaName}"."${table.tableName}") -> where -> ${resolvedWhereResult.error}`
        );
    }
    if (resolvedWhereResult.value.text === '') {
        return err(
            `delete("${table.schemaName}"."${table.tableName}") -> where -> neutral`
        );
    }
    params.push(...resolvedWhereResult.value.params);
    tokens.push('WHERE', resolvedWhereResult.value.text);

    // returning
    const _returning =
        typeof returning === 'function' ? returning(context) : returning;
    if (_returning.length !== 0) {
        const resolvedReturning = resolveReturning(
            column => [table.columns[column].title, undefined],
            _returning,
            params.length + 1
        );
        if (!resolvedReturning.ok) {
            return err(
                `delete("${table.schemaName}"."${table.tableName}") -> ${resolvedReturning.error}`
            );
        }
        params.push(...resolvedReturning.value.params);
        tokens.push('RETURNING', resolvedReturning.value.text);
    }

    return ok({ sql: tokens.join(' '), params });
};

// join
type JoinType = 'inner' | 'left' | 'right' | 'full';
type TableWithAlias = {
    table: Table;
    alias: string;
};
type JoinData = {
    joinType: JoinType;
    on: boolean | ((contexts: Record<string, Context>) => boolean);
};
type SchemaMapKeys<SMap extends Record<string, Schema>> = {
    [key in keyof SMap & string]: `${key}_${keyof SMap[key] & string}`;
}[keyof SMap & string];
type SchemaMapContexts<SMap extends Record<string, Schema>> = {
    [key in keyof SMap & string as `${key}Context`]: Context<SMap[key]>;
};
type PrefixAliasOnSchema<S extends Schema, A extends string> = {
    [key in keyof S as `${A}_${key & string}`]: S[key];
};
type JoinEntity<SMap extends Record<string, Schema>, AllS extends Schema> = {
    contexts: SchemaMapContexts<SMap>;
    select: <
        R extends readonly (
            | (keyof AllS & string)
            | CustomColumn<unknown, string>
        )[]
    >(
        returning: R | ((contexts: SchemaMapContexts<SMap>) => R),
        where: boolean | ((contexts: SchemaMapContexts<SMap>) => boolean),
        options?: JoinSelectOptions<SMap>
    ) => Query<AllS, R>;
    join: <JS extends Schema, JA extends string>(
        joinType: JoinType,
        joinTable: Table<JS>,
        joinAlias: JA,
        on:
            | boolean
            | ((contexts: SchemaMapContexts<SMap & Record<JA, JS>>) => boolean)
    ) => JoinEntity<SMap & Record<JA, JS>, AllS & PrefixAliasOnSchema<JS, JA>>;
};
type JoinSelectOptions<
    Ss extends Record<string, Schema> = Record<string, Schema>
> = {
    distinct?: true | SchemaMapKeys<Ss>[];
    groupBy?: unknown[] | ((contexts: SchemaMapContexts<Ss>) => unknown[]);
    orders?: {
        by: SchemaMapKeys<Ss>;
        direction: OrderDirection;
    }[];
    start?: bigint;
    step?: number;
};

const createJoinSelectEntity = <
    SMap extends Record<string, Schema>,
    AllS extends Schema
>(
    main: TableWithAlias,
    joinTables: (TableWithAlias & JoinData)[],
    contexts: SchemaMapContexts<SMap>
): JoinEntity<SMap, AllS> => ({
    contexts: contexts,
    select: function <
        R extends readonly (
            | (keyof AllS & string)
            | CustomColumn<unknown, string>
        )[]
    >(
        returning: R | ((contexts: SchemaMapContexts<SMap>) => R),
        where: boolean | ((contexts: SchemaMapContexts<SMap>) => boolean),
        options = {} as JoinSelectOptions<SMap>
    ): Query<AllS, R> {
        return createQuery(params =>
            createJoinSelectQuery(
                this.contexts,
                main,
                joinTables,
                returning as
                    | ReturningRows
                    | ((contexts: Record<string, Context>) => ReturningRows),
                where as
                    | boolean
                    | ((contexts: Record<string, Context>) => boolean),
                options as JoinSelectOptions,
                params
            )
        );
    },
    join: function <JS extends Schema, JA extends string>(
        joinType: JoinType,
        joinTable: Table<JS>,
        joinAlias: JA,
        on:
            | boolean
            | ((contexts: SchemaMapContexts<SMap & Record<JA, JS>>) => boolean)
    ): JoinEntity<SMap & Record<JA, JS>, AllS & PrefixAliasOnSchema<JS, JA>> {
        joinTables.push({
            table: joinTable as Table,
            on: on as
                | boolean
                | ((contexts: Record<string, Context>) => boolean),
            joinType,
            alias: joinAlias
        });
        return createJoinSelectEntity<
            SMap & Record<JA, JS>,
            AllS & PrefixAliasOnSchema<JS, JA>
        >(main, joinTables, {
            ...contexts,
            [`${joinAlias}Context`]: createContext(joinTable, joinAlias)
        } as SchemaMapContexts<SMap & Record<JA, JS>>);
    }
});
const createJoinSelectQuery = (
    contexts: Record<string, Context>,
    main: TableWithAlias,
    joinTables: (TableWithAlias & JoinData)[],
    returning:
        | ReturningRows
        | ((contexts: Record<string, Context>) => ReturningRows),
    where: boolean | ((contexts: Record<string, Context>) => boolean),
    options: JoinSelectOptions,
    params: string[]
): Result<QueryData, string> => {
    const errorPrefix = `join-select("${main.table.schemaName}"."${main.table.tableName}")`;
    const allTables = [main, ...joinTables];
    const {
        distinct = false,
        groupBy = [],
        orders = [],
        start,
        step
    } = options;
    const tokens = ['SELECT'];

    // distinct
    if (distinct === true) {
        tokens.push('DISTINCT');
    } else if (Array.isArray(distinct)) {
        tokens.push(
            `DISTINCT ON(${distinct
                .map(column => {
                    const { table, alias } = getTableDataOfJoinSelectColumn(
                        allTables,
                        column
                    );
                    return resolveColumn(
                        table,
                        column.substring((alias + '_').length),
                        true,
                        alias
                    );
                })
                .join(', ')})`
        );
    }

    // select
    const _returning =
        typeof returning === 'function' ? returning(contexts) : returning;
    const resolvedReturning = resolveReturning(
        column => {
            const { table, alias } = getTableDataOfJoinSelectColumn(
                allTables,
                column
            );
            const columnKey = column.substring((alias + '_').length);
            return [table.columns[columnKey].title, alias];
        },
        _returning,
        params.length + 1
    );
    if (!resolvedReturning.ok) {
        return err(`${errorPrefix} -> ${resolvedReturning.error}`);
    }
    params.push(...resolvedReturning.value.params);
    tokens.push(
        resolvedReturning.value.text,
        `FROM "${main.table.schemaName}"."${main.table.tableName}" "${main.alias}"`
    );

    // join
    for (const joinTable of joinTables) {
        const onExpressionResult = resolveExpression(
            typeof joinTable.on === 'function'
                ? joinTable.on(contexts)
                : joinTable.on,
            params.length + 1,
            false
        );
        if (!onExpressionResult.ok) {
            return err(
                `${errorPrefix} -> join -> ${joinTables.indexOf(joinTable)} -> ${onExpressionResult.error}`
            );
        }
        if (onExpressionResult.value.text === '') {
            return err(
                `${errorPrefix} -> join -> ${joinTables.indexOf(joinTable)} -> neutral`
            );
        }
        params.push(...onExpressionResult.value.params);
        tokens.push(
            `${Dictionary.JoinType[joinTable.joinType]} "${joinTable.table.schemaName}"."${joinTable.table.tableName}" "${
                joinTable.alias
            }" ON ${onExpressionResult.value.text}`
        );
    }

    // where
    const resolvedWhereResult = resolveExpression(
        typeof where === 'function' ? where(contexts) : where,
        params.length + 1,
        false
    );
    if (!resolvedWhereResult.ok) {
        return err(`${errorPrefix} -> where -> ${resolvedWhereResult.error}`);
    }
    if (resolvedWhereResult.value.text === '') {
        return err(`${errorPrefix} -> where -> neutral`);
    }
    params.push(...resolvedWhereResult.value.params);
    tokens.push('WHERE', resolvedWhereResult.value.text);

    // groupBy
    const _groupBy =
        typeof groupBy === 'function' ? groupBy(contexts) : groupBy;
    if (_groupBy.length !== 0) {
        const groupByTextArray = [];
        for (const aGroupBy of _groupBy) {
            const resolvedGroupBy = resolveExpression(
                aGroupBy,
                params.length + 1,
                false
            );
            if (!resolvedGroupBy.ok) {
                return err(
                    `${errorPrefix} -> groupBy -> ${_groupBy.indexOf(aGroupBy)} -> ${resolvedGroupBy.error}`
                );
            }
            params.push(...resolvedGroupBy.value.params);
            groupByTextArray.push(resolvedGroupBy.value.text);
        }
        tokens.push('GROUP BY', groupByTextArray.join(', '));
    }

    // orders
    if (orders.length !== 0) {
        const ordersTextArray = [];
        for (const order of orders) {
            const { by, direction } = order;
            const { table, alias } = getTableDataOfJoinSelectColumn(
                allTables,
                by
            );
            ordersTextArray.push(
                `${resolveColumn(
                    table,
                    by.substring((alias + '_').length),
                    true,
                    alias
                )} ${Dictionary.OrderDirection[direction]}`
            );
        }
        tokens.push('ORDER BY', ordersTextArray.join(', '));
    }

    // pagination
    if (start !== undefined) {
        if (start < 0) {
            return err(`${errorPrefix} -> start -> invalid`);
        }
        tokens.push('OFFSET', start.toString());
    }
    if (step !== undefined) {
        if (step <= 0) {
            return err(`${errorPrefix} -> step -> invalid`);
        }
        tokens.push('LIMIT', step.toString());
    }

    return ok({ sql: tokens.join(' '), params });
};
const getTableDataOfJoinSelectColumn = (
    tablesData: TableWithAlias[],
    column: string
): TableWithAlias => {
    const splitColumn = column.split('_');
    if (splitColumn.length < 2) {
        throw `no separator`;
    }

    // in case alias or column key have "_". iterate on all of them until a match.
    for (let i = 1; i < splitColumn.length; i++) {
        const tableAlias = splitColumn.slice(0, i).join('_');
        for (const tableData of tablesData) {
            if (
                tableData.alias === tableAlias &&
                tableData.table.columns[splitColumn.slice(i).join('_')] !==
                    undefined
            ) {
                return tableData;
            }
        }
    }

    throw `column not found`;
};

// util
type OrderDirection = 'asc' | 'desc';
type Mode = [] | ['count', number] | ['get', 'one' | number];
type CustomColumn<T, N extends string> = {
    expression: T;
    name: N;
};

type NullableAndDefaultColumns<S extends Schema> = {
    [key in keyof S as true extends S[key]['nullable']
        ? key
        : true extends S[key]['default']
          ? key
          : never]: true extends S[key]['nullable']
        ? S[key]
        : true extends S[key]['default']
          ? S[key]
          : never;
};

type Query<
    S extends Schema,
    R extends readonly (keyof S | CustomColumn<unknown, string>)[]
> = {
    getData: (params?: string[]) => Result<QueryData, string>;
    execute: <M extends Mode>(
        client: ClientBase,
        mode: M,
        params?: string[]
    ) => Promise<Result<QueryResult<S, R, M>, unknown>>;
};
type QueryData = {
    sql: string;
    params: string[];
};
type QueryResult<
    S extends Schema,
    R extends readonly (keyof S | CustomColumn<unknown, string>)[],
    M extends Mode
> = M extends ['get', 'one']
    ? QueryResultRow<S, R>
    : M extends ['get', number] | []
      ? QueryResultRow<S, R>[]
      : M extends ['count', number]
        ? undefined
        : never;
type QueryResultRow<
    S extends Schema,
    R extends readonly (keyof S | CustomColumn<unknown, string>)[]
> = {
    [key in Exclude<keyof R, keyof never[]> as R[key] extends CustomColumn<
        unknown,
        infer N
    >
        ? N
        : R[key] & string]: R[key] extends CustomColumn<infer T, string>
        ? T
        : NullableType<
              S[R[key] & string]['type'],
              S[R[key] & string]['nullable']
          >;
};
type ReturningRows = readonly (string | CustomColumn<unknown, string>)[];

const createQuery = <
    S extends Schema,
    R extends readonly (keyof S | CustomColumn<unknown, string>)[]
>(
    createQueryData: (params: string[]) => Result<QueryData, string>
): Query<S, R> => {
    let queryDataResult: Result<QueryData, string>;
    return {
        getData: (params = []) => {
            if (queryDataResult === undefined) {
                queryDataResult = createQueryData(params);
            }
            if (!queryDataResult.ok) {
                return queryDataResult;
            }
            return queryDataResult;
        },
        execute: async <M extends Mode>(
            client: ClientBase,
            mode: M,
            params: string[] = []
        ) => {
            if (queryDataResult === undefined) {
                queryDataResult = createQueryData(params);
            }
            if (!queryDataResult.ok) {
                return Promise.resolve(queryDataResult);
            }
            return client
                .query(
                    queryDataResult.value.sql + ';',
                    queryDataResult.value.params
                )
                .then(({ rows }) => resolveResult<S, R, M>(rows, mode))
                .catch(e => err(e));
        }
    };
};

export {
    createEntity,
    createSelectQuery,
    createInsertQuery,
    createUpdateQuery,
    createDeleteQuery,
    createJoinSelectEntity,
    createJoinSelectQuery,
    getTableDataOfJoinSelectColumn,
    createQuery
};
export type {
    SelectOptions,
    InsertOptions,
    InsertingRow,
    UpdateSets,
    JoinType,
    TableWithAlias,
    JoinData,
    SchemaMapKeys,
    SchemaMapContexts,
    PrefixAliasOnSchema,
    JoinEntity,
    JoinSelectOptions,
    OrderDirection,
    Mode,
    CustomColumn,
    NullableAndDefaultColumns,
    Query,
    QueryData,
    QueryResult,
    QueryResultRow,
    ReturningRows
};
