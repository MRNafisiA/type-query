import U from './U';
import {ClientBase} from 'pg';
import Decimal from 'decimal.js';
import type Table from './types/table';
import {createContext} from './context';
import type {Column} from './types/table';
import type {Context} from './types/context';
import {ok, err, type Result} from 'never-catch';
import {OrderDirection, PostgresType} from './types/postgres';
import {toJoinType, toOrderDirection, toReservedExpressionKeyDescription as toDescription} from './dictionary';
import type {
    Mode,
    Param,
    Expression,
    ExpressionTypes,
    InsertValue,
    CustomColumn,
    NullableAndDefaultColumns,
    QueryData,
    Query,
    QueryResult,
    PartialQuery,
    UpdateSets,
    JoinType,
    TablesColumnsKeys,
    TableWithAlias,
    JoinData, AliasedColumns
} from './types/entity';

// entity
const createEntity = <T extends Table>(table: T) => ({
    table: table,
    context: createContext(table),
    select: function <R extends readonly ((keyof T['columns'] & string) | CustomColumn<Expression<ExpressionTypes>, string>)[]>(
        returning: R | ((context: Context<T['columns']>) => R),
        where: Expression<boolean> | ((context: Context<T['columns']>) => Expression<boolean>),
        options?: {
            ignoreInWhere?: boolean,
            ignoreInReturning?: boolean,
            ignoreInGroupBy?: boolean,
            groupBy?: Expression<ExpressionTypes>[] | ((context: Context<T['columns']>) => Expression<ExpressionTypes>[]),
            orders?: { by: keyof T['columns'] & string, direction: OrderDirection }[],
            start?: bigint,
            step?: number
        }
    ) {
        const ignoreInWhere = (options?.ignoreInWhere) ?? false;
        const ignoreInReturning = (options?.ignoreInReturning) ?? false;
        const ignoreInGroupBy = (options?.ignoreInGroupBy) ?? false;
        const groupBy = (options?.groupBy) ?? [];
        const orders = (options?.orders) ?? [];
        const start = options?.start;
        const step = options?.step;

        const _returning = typeof returning === 'function' ? returning(this.context) : returning;

        const createQuery = (params: Param[]) => {
            const tokens = ['SELECT'];

            // select
            const resolvedReturning = resolveReturning(
                column => ({type: table.columns[column].type, title: table.columns[column].title}),
                _returning, params.length + 1, ignoreInReturning);
            if (!resolvedReturning.ok) {
                return err(`<select> -> ${resolvedReturning.error}`);
            }
            params.push(...resolvedReturning.value.params);
            tokens.push(resolvedReturning.value.text);

            // from
            tokens.push(`FROM "${table.schema}"."${table.title}"`);

            // where
            const resolvedWhereResult = resolveExpression(typeof where === 'function' ? where(this.context) : where, params.length + 1, ignoreInWhere);
            if (!resolvedWhereResult.ok) {
                return err(`<select>[where] -> ${resolvedWhereResult.error}`);
            }
            if (resolvedWhereResult.value.text === '' && !ignoreInWhere) {
                return err(`<select>[where] -> neutral`);
            }
            params.push(...resolvedWhereResult.value.params);
            tokens.push('WHERE', resolvedWhereResult.value.text === '' ? 'TRUE' : resolvedWhereResult.value.text);

            // groupBy
            const _groupBy = typeof groupBy === 'function' ? groupBy(this.context) : groupBy;
            if (groupBy.length !== 0) {
                const groupByTextArray = [];
                for (const aGroupBy of _groupBy) {
                    const resolvedGroupBy = resolveExpression(aGroupBy, params.length + 1, ignoreInGroupBy);
                    if (!resolvedGroupBy.ok) {
                        return err(`<select> -> ${resolvedGroupBy.error}`);
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
                    const {by, direction} = order;
                    ordersTextArray.push(`${resolveColumn(table, by, false)} ${toOrderDirection(direction)}`);
                }
                tokens.push('ORDER BY', ordersTextArray.join(', '));
            }

            // pagination
            if (start !== undefined) {
                if (start < 0) {
                    return err(`<select>[start] -> invalid`);
                }
                tokens.push('OFFSET', start.toString());
            }
            if (step !== undefined) {
                if (step <= 0) {
                    return err(`<select>[step] -> invalid`);
                }
                tokens.push('LIMIT', step.toString());
            }

            tokens.push(';');
            const sql = tokens.join(' ');

            return ok({sql, params});
        };
        return createQueryResult<T['columns'], R>(column => [table.columns[column].type, table.columns[column].nullable], createQuery, _returning);
    },
    insert: function <R extends readonly ((keyof T['columns'] & string) | CustomColumn<Expression<ExpressionTypes>, string>)[], N extends readonly (keyof NullableAndDefaultColumns<T['columns']>)[] = []>(
        rows: InsertValue<T['columns'], N>[] | ((context: Context<T['columns']>) => InsertValue<T['columns'], N>[]),
        returning: R | ((context: Context<T['columns']>) => R),
        options?: {
            nullableDefaultColumns?: N,
            ignoreInValues?: boolean,
            ignoreInReturning?: boolean
        }
    ) {
        const nullableDefaultColumns = (options?.nullableDefaultColumns) ?? [] as string[];
        const ignoreInValues = (options?.ignoreInValues) ?? false;
        const ignoreInReturning = (options?.ignoreInValues) ?? false;

        const _returning = typeof returning === 'function' ? returning(this.context) : returning;

        const createQuery = (params: Param[]) => {
            const tokens = [`INSERT INTO "${table.schema}"."${table.title}"`];

            // columns
            const insertingColumns: (keyof T['columns'] & string)[] = [];
            const columnsTextArray = [];
            for (const column in table.columns) {
                if (nullableDefaultColumns.includes(column as any) || !table.columns[column].nullable) {
                    insertingColumns.push(column);
                    columnsTextArray.push(resolveColumn(table, column, false));
                }
            }
            tokens.push(`( ${columnsTextArray.join(', ')} )`, 'VALUES');

            // values
            if (rows.length === 0) {
                return err('<insert>[values] -> empty');
            }
            const valuesTextArray: string[] = [];
            const _rows = typeof rows === 'function' ? rows(this.context) : rows;
            for (const _row of _rows) {
                const rowTokens = [];
                for (const insertingColumn of insertingColumns) {
                    if (_row[insertingColumn] === undefined) {
                        const column = table.columns[insertingColumn];
                        switch (column.default) {
                            case 'value':
                                rowTokens.push(U.stringify(column.value, true));
                                continue;
                            case true:
                            case 'auto-increment':
                                rowTokens.push('DEFAULT');
                                continue;
                            case 'created-at':
                            case 'updated-at':
                                rowTokens.push(U.stringify(new Date(), true));
                                continue;
                        }
                        if (column.nullable) {
                            rowTokens.push(U.stringify(null));
                            continue;
                        }
                        // never going to happen!
                        return err(`<insert>[rows][${_rows.indexOf(_row)}][${insertingColumn}] -> no-value`);
                    } else {
                        const resolvedExpressionResult = resolveExpression(_row[insertingColumn], params.length + 1, ignoreInValues);
                        if (!resolvedExpressionResult.ok) {
                            return err(`<insert>[rows][${_rows.indexOf(_row)}][${insertingColumn}] -> ${resolvedExpressionResult.error}`);
                        }
                        if (resolvedExpressionResult.value.text === '') {
                            return err(`<insert>[rows][${_rows.indexOf(_row)}][${insertingColumn}] -> neutral`);
                        }
                        params.push(...resolvedExpressionResult.value.params);
                        rowTokens.push(resolvedExpressionResult.value.text);
                    }
                }
                valuesTextArray.push(`( ${rowTokens.join(', ')} )`);
            }
            tokens.push(valuesTextArray.join(', '));

            // returning
            if (_returning.length !== 0) {
                const resolvedReturning = resolveReturning(
                    column => ({type: table.columns[column].type, title: table.columns[column].title}),
                    _returning, params.length + 1, ignoreInReturning);
                if (!resolvedReturning.ok) {
                    return err(`<insert> -> ${resolvedReturning.error}`);
                }
                params.push(...resolvedReturning.value.params);
                tokens.push('RETURNING', resolvedReturning.value.text);
            }

            tokens.push(';');
            const sql = tokens.join(' ');

            return ok({sql, params});
        };
        return createQueryResult<T['columns'], R>(column => [table.columns[column].type, table.columns[column].nullable], createQuery, _returning);
    },
    update: function <R extends readonly ((keyof T['columns'] & string) | CustomColumn<Expression<ExpressionTypes>, string>)[]>(
        sets: UpdateSets<T['columns']> | ((context: Context<T['columns']>) => UpdateSets<T['columns']>),
        where: Expression<boolean> | ((context: Context<T['columns']>) => Expression<boolean>),
        returning: R | ((context: Context<T['columns']>) => R),
        options?: {
            ignoreInSets?: boolean,
            ignoreInWhere?: boolean,
            ignoreInReturning?: boolean
        }
    ) {
        const ignoreInSets = (options?.ignoreInSets) ?? false;
        const ignoreInWhere = (options?.ignoreInWhere) ?? false;
        const ignoreInReturning = (options?.ignoreInReturning) ?? false;

        const _returning = typeof returning === 'function' ? returning(this.context) : returning;

        const createQuery = (params: Param[]) => {
            const tokens = [`UPDATE "${table.schema}"."${table.title}" SET`];

            // set
            const _set = typeof sets === 'function' ? sets(this.context) : sets;
            const setsTextArray = [];
            let key: keyof typeof _set;
            for (key in _set) {
                const setExpressionResult = resolveExpression(_set[key], params.length + 1, ignoreInSets);
                if (!setExpressionResult.ok) {
                    return err(`<update>[sets][${key}] -> ${setExpressionResult.error}`);
                }
                if (setExpressionResult.value.text === '') {
                    if (ignoreInSets) {
                        continue;
                    } else {
                        return err(`<update>[sets][${key}] -> neutral`);
                    }
                }
                params.push(...setExpressionResult.value.params);
                setsTextArray.push(`${resolveColumn(table, key, false)} = ${setExpressionResult.value.text}`);
            }
            for (const column in table.columns) {
                switch (table.columns[column].default) {
                    case 'updated-at':
                        setsTextArray.push(`${resolveColumn(table, column, false)} = ${U.stringify(new Date(), true)}`);
                        break;
                }
            }
            if (setsTextArray.length === 0) {
                return err('<update>[sets] -> empty');
            }
            tokens.push(setsTextArray.join(', '));

            // where
            const resolvedWhereResult = resolveExpression(typeof where === 'function' ? where(this.context) : where, params.length + 1, ignoreInWhere);
            if (!resolvedWhereResult.ok) {
                return err(`<update>[where] -> ${resolvedWhereResult.error}`);
            }
            if (resolvedWhereResult.value.text === '' && !ignoreInWhere) {
                return err(`<update>[where] -> neutral`);
            }
            params.push(...resolvedWhereResult.value.params);
            tokens.push('WHERE', resolvedWhereResult.value.text === '' ? 'FALSE' : resolvedWhereResult.value.text);

            // returning
            if (_returning.length !== 0) {
                const resolvedReturning = resolveReturning(
                    column => ({type: table.columns[column].type, title: table.columns[column].title}),
                    _returning, params.length + 1, ignoreInReturning);
                if (!resolvedReturning.ok) {
                    return err(`<update> -> ${resolvedReturning.error}`);
                }
                params.push(...resolvedReturning.value.params);
                tokens.push('RETURNING', resolvedReturning.value.text);
            }

            tokens.push(';');
            const sql = tokens.join(' ');

            return ok({sql, params});
        };
        return createQueryResult<T['columns'], R>(column => [table.columns[column].type, table.columns[column].nullable], createQuery, _returning);
    },
    delete: function <R extends readonly ((keyof T['columns'] & string) | CustomColumn<Expression<ExpressionTypes>, string>)[]>(
        where: Expression<boolean> | ((context: Context<T['columns']>) => Expression<boolean>),
        returning: R | ((context: Context<T['columns']>) => R),
        options?: {
            ignoreInWhere?: boolean,
            ignoreInReturning?: boolean
        }
    ) {
        const ignoreInWhere = (options?.ignoreInWhere) ?? false;
        const ignoreInReturning = (options?.ignoreInReturning) ?? false;

        const _returning = typeof returning === 'function' ? returning(this.context) : returning;

        const createQuery = (params: Param[]) => {
            const tokens = [`DELETE FROM "${table.schema}"."${table.title}"`];

            // where
            const resolvedWhereResult = resolveExpression(typeof where === 'function' ? where(this.context) : where, params.length + 1, ignoreInWhere);
            if (!resolvedWhereResult.ok) {
                return err(`<delete>[where] -> ${resolvedWhereResult.error}`);
            }
            if (resolvedWhereResult.value.text === '' && !ignoreInWhere) {
                return err(`<delete>[where] -> neutral`);
            }
            params.push(...resolvedWhereResult.value.params);
            tokens.push('WHERE', resolvedWhereResult.value.text === '' ? 'FALSE' : resolvedWhereResult.value.text);

            // returning
            if (_returning.length !== 0) {
                const resolvedReturning = resolveReturning(
                    column => ({type: table.columns[column].type, title: table.columns[column].title}),
                    _returning, params.length + 1, ignoreInReturning);
                if (!resolvedReturning.ok) {
                    return err(`<delete> -> ${resolvedReturning.error}`);
                }
                params.push(...resolvedReturning.value.params);
                tokens.push('RETURNING', resolvedReturning.value.text);
            }

            tokens.push(';');
            const sql = tokens.join(' ');

            return ok({sql, params});
        };
        return createQueryResult<T['columns'], R>(column => [table.columns[column].type, table.columns[column].nullable], createQuery, _returning);
    },
    join: <MainAlias extends string, JTable extends Table, JAlias extends string>(
        mainAlias: MainAlias,
        joinType: JoinType,
        joinTable: JTable,
        joinAlias: JAlias,
        on: Expression<boolean> | ((contexts: Record<MainAlias, Context<T['columns']>> & Record<JAlias, Context<JTable['columns']>>) => Expression<boolean>)
    ) => createJoinSelectEntity<Record<MainAlias, T> & Record<JAlias, JTable>, AliasedColumns<T['columns'], MainAlias> & AliasedColumns<JTable['columns'], JAlias>>(
        {table, alias: mainAlias},
        [{table: joinTable, joinType, alias: joinAlias, on: on as any}],
        {[mainAlias]: createContext(table, mainAlias), [joinAlias]: createContext(joinTable, joinAlias)} as any)
} as const);

const createJoinSelectEntity = <TablesData extends { [key: string]: Table }, AllColumns extends { [key: string]: Column }>(
    main: TableWithAlias,
    joinTables: (TableWithAlias & JoinData)[],
    contexts: { [t in keyof TablesData]: Context<TablesData[t]['columns']> }
) => ({
    contexts: contexts,
    select: function <R extends readonly (TablesColumnsKeys<TablesData> | CustomColumn<Expression<ExpressionTypes>, string>)[]>(
        returning: R | ((contexts: { [t in keyof TablesData]: Context<TablesData[t]['columns']> }) => R),
        where: Expression<boolean> | ((contexts: { [t in keyof TablesData]: Context<TablesData[t]['columns']> }) => Expression<boolean>),
        options?: {
            ignoreInWhere?: boolean,
            ignoreInReturning?: boolean,
            ignoreInJoin?: boolean,
            orders?: { by: TablesColumnsKeys<TablesData>, direction: OrderDirection }[],
            start?: bigint,
            step?: number
        }
    ) {
        const ignoreInWhere = (options?.ignoreInWhere) ?? false;
        const ignoreInReturning = (options?.ignoreInReturning) ?? false;
        const ignoreInJoin = (options?.ignoreInJoin) ?? false;
        const orders = (options?.orders) ?? [];
        const start = options?.start;
        const step = options?.step;

        const allTables = [main, ...joinTables] as typeof main[];
        const _returning = typeof returning === 'function' ? returning(this.contexts) : returning;

        const createQuery = (params: Param[]) => {
            const tokens = ['SELECT'];

            // select
            const resolvedReturning = resolveReturning(
                column => {
                    const {table, alias} = getTableDataOfJoinSelectColumn(allTables, column);
                    const columnKey = column.substring((alias + '_').length);
                    return {type: table.columns[columnKey].type, title: table.columns[columnKey].title, alias};
                },
                _returning, params.length + 1, ignoreInReturning);
            if (!resolvedReturning.ok) {
                return err(`<join-select>[columns] -> ${resolvedReturning.error}`);
            }
            params.push(...resolvedReturning.value.params);
            tokens.push(resolvedReturning.value.text, `FROM "${main.table.schema}"."${main.table.title}" "${main.alias}"`);

            // join
            for (const joinTable of joinTables) {
                const onExpressionResult = resolveExpression(typeof joinTable.on === 'function' ? joinTable.on(this.contexts) : joinTable.on, params.length + 1, ignoreInJoin);
                if (!onExpressionResult.ok) {
                    return err(`<join-select>[join][${joinTables.indexOf(joinTable)}] -> ${onExpressionResult.error}`);
                }
                if (onExpressionResult.value.text === '' && !ignoreInJoin) {
                    return err(`<join-select>[join][${joinTables.indexOf(joinTable)}] -> neutral`);
                }
                params.push(...onExpressionResult.value.params);
                tokens.push(`${toJoinType(joinTable.joinType)} "${joinTable.table.schema}"."${joinTable.table.title}" "${joinTable.alias}" ON ${onExpressionResult.value.text}`);
            }

            // where
            const resolvedWhereResult = resolveExpression(typeof where === 'function' ? where(this.contexts) : where, params.length + 1, ignoreInWhere);
            if (!resolvedWhereResult.ok) {
                return err(`<join-select>[where] -> ${resolvedWhereResult.error}`);
            }
            if (resolvedWhereResult.value.text === '' && !ignoreInWhere) {
                return err(`<join-select>[where] -> neutral`);
            }
            params.push(...resolvedWhereResult.value.params);
            tokens.push('WHERE', resolvedWhereResult.value.text === '' ? 'FALSE' : resolvedWhereResult.value.text);

            // orders
            if (orders.length !== 0) {
                const ordersTextArray = [];
                for (const order of orders) {
                    const {by, direction} = order;
                    ordersTextArray.push(`"${by}" ${direction}`);
                }
                tokens.push('ORDER BY', ordersTextArray.join(', '));
            }

            // pagination
            if (start !== undefined) {
                if (start < 0) {
                    return err(`<join-select>[start] -> invalid`);
                }
                tokens.push('OFFSET', start.toString());
            }
            if (step !== undefined) {
                if (step <= 0) {
                    return err(`<join-select>[step] -> invalid`);
                }
                tokens.push('LIMIT', step.toString());
            }

            tokens.push(';');
            const sql = tokens.join(' ');

            return ok({sql, params});
        };
        return createQueryResult<AllColumns, R>(column => {
            const {alias, table: {columns}} = getTableDataOfJoinSelectColumn(allTables, column as string);
            const targetCol = columns[column.substring((alias + '_').length)];
            return [targetCol.type, targetCol.nullable];
        }, createQuery, _returning);
    },
    join: function <JTable extends Table, JAlias extends string>(
        joinType: JoinType,
        joinTable: JTable,
        joinAlias: JAlias,
        on: Expression<boolean> | ((contexts: { [t in keyof TablesData]: Context<TablesData[t]['columns']> } & Record<JAlias, Context<JTable['columns']>>) => Expression<boolean>)
    ) {
        joinTables.push({table: joinTable, on: on as any, joinType, alias: joinAlias});
        return createJoinSelectEntity<TablesData & Record<JAlias, JTable>, AllColumns & AliasedColumns<JTable['columns'], JAlias>>(
            main,
            joinTables,
            {
                ...contexts,
                [joinAlias]: createContext(joinTable, joinAlias)
            }
        );
    }
} as const);

// utils
const ReservedExpressionKeys = ['val', '=n', '!=n', '=t', '=f', 'not', '+', '-', '*', '/', '||', 'and', 'or',
    '**', 'fun', 'swt', 'col', 'raw', '=', '!=', '>', '>=', '<', '<=', 'lk', '@>', '<@', '?', 'j-', 'in', 'nin',
    'lka', 'lks', '?|', '?&', 'j-a', 'bt', 'qry', 'exists'] as const;

const createQueryResult = <Columns extends Table['columns'], R extends readonly ((keyof Columns & string) | CustomColumn<Expression<ExpressionTypes>, string>)[]>(
    getColumnType: (column: keyof Columns & string) => [type: PostgresType, nullable: boolean],
    createQuery: (params: Param[]) => Result<QueryData, string>, returning: R
): Query<Columns, R> => {
    let query: { sql: string, params: Param[] } | undefined = undefined;
    return ({
        getData: (params = []) => {
            if (query === undefined) {
                const createQueryResult = createQuery(params);
                if (createQueryResult.ok) {
                    query = createQueryResult.value;
                } else {
                    return createQueryResult;
                }
            }
            return ok(query);
        },
        exec: <M extends Mode>(client: ClientBase, mode: M, params: Param[] = []) => {
            if (query === undefined) {
                const createQueryResult = createQuery(params);
                if (createQueryResult.ok) {
                    query = createQueryResult.value;
                } else {
                    return Promise.resolve(createQueryResult);
                }
            }
            return client.query(query.sql, query.params)
                .then(({rows}) => resolveResult<Columns, R, M>(getColumnType, returning, rows, mode))
                .catch(e => err(e));
        }
    });
};

/*
* take getColumnType instead of table to support join-select too.
* this cause hard to call this function directly, but it is only solution I could come up with.
*/
const resolveResult = <Columns extends Table['columns'], C extends readonly ((keyof Columns & string) | CustomColumn<Expression<ExpressionTypes>, string>)[], M extends Mode>(
    getColumnType: (column: keyof Columns & string) => [type: PostgresType, nullable: boolean], columns: C, rows: any[], mode: M
): Result<QueryResult<Columns, C, M>, false> => {
    // check size in count and get mode
    if (mode[0] === 'count') {
        return rows.length === mode[1] ? ok(undefined) as any : err(false);
    }
    if (mode[0] === 'get' && rows.length !== (mode[1] === 'one' ? 1 : mode[1])) {
        return err(false);
    }

    // parse result
    rows.forEach((_, i) => {
        columns.forEach(column => {
            if (typeof column !== 'object') {
                rows[i][column] = U.cast(rows[i][column], getColumnType(column));
            }
        });
    });

    // return first element for [get, one] mode and all for [get, number] and []
    if (mode[0] === 'get' && mode[1] === 'one') {
        return ok(rows[0]);
    } else {
        return ok(rows) as any;
    }
};

/*
* take getColumnTypeTitleAlias instead of table to support join-select too.
* this cause hard to call this function directly, but it is only solution I could come up with.
*/
const resolveReturning = <C extends string>(
    getColumnTypeTitleAlias: (column: C) => { type: PostgresType, title?: string | undefined, alias?: string | undefined },
    columns: readonly(C | CustomColumn<Expression<ExpressionTypes>, string>)[], paramsStart: number, ignore: boolean
): Result<PartialQuery, string> => {
    const tokens = [];
    const params: Param[] = [];
    for (const column of columns) {
        if (typeof column === 'object') {
            const resolvedExpResult = resolveExpression(column.exp, paramsStart, ignore);
            if (!resolvedExpResult.ok) {
                return err(`<returning>[${column.as}] -> ${resolvedExpResult.error}`);
            }
            if (resolvedExpResult.value.text === '') {
                return err(`<returning>[${column.as}] -> neutral`);
            }
            params.push(...resolvedExpResult.value.params);
            paramsStart += resolvedExpResult.value.params.length;

            tokens.push(`( ${resolvedExpResult.value.text} ) AS "${column.as}"`);
        } else {
            const {type: _type, title, alias} = getColumnTypeTitleAlias(column);
            // TODO cast time with/without timezone to custom object
            if (title === undefined) {
                if (alias !== undefined) {
                    tokens.push(
                        `"${alias}".` +
                        `"${column.substring((alias + '_').length)}"` +
                        ` AS "${column}"`
                    );
                } else {
                    tokens.push(
                        `"${column}"`
                    );
                }
            } else {
                tokens.push(
                    (alias !== undefined ? `"${alias}".` : '') +
                    `"${title}"` +
                    ` AS "${column}"`
                );
            }
        }
    }
    if (tokens.length === 0) {
        return err('<returning> -> empty');
    }
    return ok(partialQuery(tokens.join(', '), params));
};

/*
** currently all errors are handled with types and no dynamic check is required.
** errors return only when ignore is false and an expression needs ignorance.
** so, some errors written in function, but they will never be returned.
** e.g.
** if (e1Result.value.text === '') {
**     return ignore ? ok(partialQuery()) : err(`<${toDescription(expression[0])}> -> neutral`);
** }
* if result is neutral then ignore is true, so error in this example will never be returned.
* but they exist in case new errors with dynamic check added.
*/
const resolveExpression = (expression: Expression<ExpressionTypes>, paramsStart: number, ignore: boolean = false): Result<PartialQuery, string> => {
    // primitive expression
    if (expression === undefined) {
        return ignore ? ok(partialQuery()) : err('undefined');
    }
    if (expression === null || typeof expression === 'boolean' || expression instanceof Decimal
        || expression instanceof Date || typeof expression === 'number' || typeof expression === 'bigint') {
        return ok(partialQuery(`${U.stringify(expression, true)}`));
    }
    if (typeof expression === 'string' || !(Array.isArray(expression) && ReservedExpressionKeys.includes((expression as any[])[0]))) {
        return ok(partialQuery(`$${paramsStart++}`, [U.stringify(expression as any, false)]));
    }

    // wrapped expression
    const tokens = [];
    const params: Param[] = [];
    let e1Result, e2Result, e3Result;
    switch (expression[0]) {
        case 'val':
            if (expression[1] === undefined) {
                return ignore ? ok(partialQuery()) : err(`<${toDescription('val')}> -> undefined`);
            }
            params.push(U.stringify(expression[1], false));
            return ok(partialQuery(`$${paramsStart++}`, params));
        case '=n':
        case '!=n':
        case '=t':
        case '=f':
        case 'not':
            e1Result = resolveExpression(expression[1], paramsStart, ignore);
            if (!e1Result.ok) {
                return err(`<${toDescription(expression[0])}> -> ${e1Result.error}`);
            }
            if (e1Result.value.text === '') {
                return ignore ? ok(partialQuery()) : err(`<${toDescription(expression[0])}> -> neutral`);
            }
            params.push(...e1Result.value.params);
            paramsStart += e1Result.value.params.length;

            switch (expression[0]) {
                case '=n':
                    return ok(partialQuery(`${e1Result.value.text} IS NULL`, params));
                case '!=n':
                    return ok(partialQuery(`${e1Result.value.text} IS NOT NULL`, params));
                case '=t':
                    return ok(partialQuery(`${e1Result.value.text}`, params));
                case '=f':
                case 'not':
                    return ok(partialQuery(`NOT ${e1Result.value.text}`, params));
            }
        case '+':
        case '-':
        case '*':
        case '/':
        case '||':
        case 'and':
        case 'or':
        case '**':
            if (expression[1] === undefined) {
                return ignore ? ok(partialQuery()) : err(`<${toDescription(expression[0])}> -> undefined`);
            }
            for (const v1 of expression[1] as any[]) {
                const v1Result = resolveExpression(v1, paramsStart, ignore);
                if (!v1Result.ok) {
                    return err(`<${toDescription(expression[0])}>[${(expression[1] as any[]).indexOf(v1)}] -> ${v1Result.error}`);
                }
                if (v1Result.value.text === '') {
                    if (ignore) {
                        continue;
                    } else {
                        return err(`<${toDescription(expression[0])}>[${(expression[1] as any[]).indexOf(v1)}] -> neutral`);
                    }
                }
                params.push(...v1Result.value.params);
                paramsStart += v1Result.value.params.length;

                tokens.push(v1Result.value.text);
            }
            switch (tokens.length) {
                case 0:
                    return ignore ? ok(partialQuery())
                        : err(`<${toDescription(expression[0])}> -> no operands given`);
                case 1:
                    return ok(partialQuery(tokens[0], params));
                default:
                    switch (expression[0]) {
                        case '+':
                            return ok(partialQuery(`( ${tokens.join(' + ')} )`, params));
                        case '-':
                            return ok(partialQuery(`( ${tokens.join(' - ')} )`, params));
                        case '*':
                            return ok(partialQuery(`( ${tokens.join(' * ')} )`, params));
                        case '/':
                            return ok(partialQuery(`( ${tokens.join(' / ')} )`, params));
                        case '||':
                            return ok(partialQuery(`( ${tokens.join(' || ')} )`, params));
                        case 'and':
                            return ok(partialQuery(`( ${tokens.join(' AND ')} )`, params));
                        case 'or':
                            return ok(partialQuery(`( ${tokens.join(' OR ')} )`, params));
                        case '**':
                            const tmp = tokens.pop();
                            tokens.splice(0, 0, 'a');
                            return ok({
                                text: tokens.join(', power( ').substring(3) + ', ' + tmp + ' )'.repeat(tokens.length - 1),
                                params
                            });
                    }
            }
        case 'fun':
            if (expression[1] === undefined) {
                return ignore ? ok(partialQuery())
                    : err(`<${toDescription(expression[0])}>[name] -> undefined`);
            }
            if (expression[2] === undefined) {
                return ignore ? ok(partialQuery())
                    : err(`<${toDescription(expression[0])}>[parameters] -> undefined`);
            }
            for (const v2 of expression[2] as any[]) {
                const v2Result = resolveExpression(v2, paramsStart, ignore);
                if (!v2Result.ok) {
                    return err(`<${toDescription(expression[0])}>[parameters][${(expression[2] as any[]).indexOf(v2)}] -> ${v2Result.error}`);
                }
                if (v2Result.value.text === '') {
                    return ignore ? ok(partialQuery())
                        : err(`<${toDescription(expression[0])}>[parameters][${(expression[2] as any[]).indexOf(v2)}] -> neutral`);
                }
                params.push(...v2Result.value.params);
                paramsStart += v2Result.value.params.length;

                tokens.push(v2Result.value.text);
            }
            return ok(partialQuery(`${expression[1]}( ${tokens.join(', ')} )${expression[3]}`, params));
        case 'swt':
            const cases = expression[1] as any[] | undefined;
            const otherwise = expression[2] as any;
            if (cases === undefined) {
                if (!ignore) {
                    return err(`<${toDescription(expression[0])}>[cases] -> undefined`);
                }
            } else {
                for (const caseElement of cases) {
                    if (caseElement === undefined) {
                        if (ignore) {
                            continue;
                        } else {
                            return err(`<${toDescription(expression[0])}>[cases][${cases.indexOf(caseElement)}] -> undefined`);
                        }
                    }

                    const whenResult = resolveExpression(caseElement.when, paramsStart, ignore);
                    if (!whenResult.ok) {
                        return err(`<${toDescription(expression[0])}>[cases][${cases.indexOf(caseElement)}][when] -> ${whenResult.error}`);
                    }
                    if (whenResult.value.text === '') {
                        if (ignore) {
                            continue;
                        } else {
                            return err(`<${toDescription(expression[0])}>[cases][${cases.indexOf(caseElement)}][when] -> neutral`);
                        }
                    }
                    params.push(...whenResult.value.params);
                    paramsStart += whenResult.value.params.length;

                    const thenResult = resolveExpression(caseElement.then, paramsStart, ignore);
                    if (!thenResult.ok) {
                        return err(`<${toDescription(expression[0])}>[cases][${cases.indexOf(caseElement)}][then] -> ${thenResult.error}`);
                    }
                    if (thenResult.value.text === '') {
                        if (ignore) {
                            continue;
                        } else {
                            return err(`<${toDescription(expression[0])}>[cases][${cases.indexOf(caseElement)}][then] -> neutral`);
                        }
                    }
                    params.push(...thenResult.value.params);
                    paramsStart += thenResult.value.params.length;

                    if (tokens.length === 0) {
                        tokens.push('CASE');
                    }
                    tokens.push(`WHEN ${whenResult.value.text} THEN ${thenResult.value.text}`);
                }
            }
            if (tokens.length === 0 && !ignore) {
                return err(`<${toDescription(expression[0])}>[cases] -> empty`);
            }
            if (otherwise === undefined) {
                if (tokens.length === 0) {
                    return ok(partialQuery());
                } else {
                    tokens.push('END');
                }
            } else {
                let isOtherwiseNeutral = false;

                const otherwiseResult = resolveExpression(otherwise, paramsStart, ignore);
                if (!otherwiseResult.ok) {
                    return err(`<${toDescription(expression[0])}>[otherwise] -> ${otherwiseResult.error}`);
                }
                if (otherwiseResult.value.text === '') {
                    if (ignore) {
                        isOtherwiseNeutral = true;
                    } else {
                        return err(`<${toDescription(expression[0])}>[otherwise] -> neutral`);
                    }
                }
                params.push(...otherwiseResult.value.params);
                paramsStart += otherwiseResult.value.params.length;

                if (tokens.length === 0) {
                    if (isOtherwiseNeutral) {
                        return ok(partialQuery());
                    } else {
                        tokens.push(otherwiseResult.value.text);
                    }
                } else {
                    if (!isOtherwiseNeutral) {
                        tokens.push('ELSE', otherwiseResult.value.text);
                    }
                    tokens.push('END');
                }
            }
            return ok(partialQuery(tokens.join(' '), params));
        case 'col':
        case 'raw':
            return ok(partialQuery(`${expression[1]}`));
        case 'qry':
        case 'exists':
            const subQueryDataResult = (expression[1] as unknown as Query<any, any>).getData(params);
            if (!subQueryDataResult.ok) {
                return err(`<${toDescription(expression[0])}> -> ${subQueryDataResult.error}`);
            }
            paramsStart += subQueryDataResult.value.params.length;

            switch (expression[0]) {
                case 'qry':
                    return ok(partialQuery(`( ${subQueryDataResult.value.sql} )`, params));
                case 'exists':
                    return ok(partialQuery(`EXISTS ( ${subQueryDataResult.value.sql} )`, params));
            }
        case '=':
        case '!=':
        case '>':
        case '>=':
        case '<':
        case '<=':
        case 'lk':
        case '@>':
        case '<@':
        case '?':
        case 'j-':
            e1Result = resolveExpression(expression[1], paramsStart, ignore);
            if (!e1Result.ok) {
                return err(`<${toDescription(expression[0])}>[first operand] -> ${e1Result.error}`);
            }
            if (e1Result.value.text === '') {
                return ignore ? ok(partialQuery())
                    : err(`<${toDescription(expression[0])}>[first operand] -> netural`);
            }
            params.push(...e1Result.value.params);
            paramsStart += e1Result.value.params.length;

            e2Result = resolveExpression(expression[2], paramsStart, ignore);
            if (!e2Result.ok) {
                return err(`<${toDescription(expression[0])}>[second operand] -> ${e2Result.error}`);
            }
            if (e2Result.value.text === '') {
                return ignore ? ok(partialQuery())
                    : err(`<${toDescription(expression[0])}>[second operand] -> netural`);
            }
            params.push(...e2Result.value.params);
            paramsStart += e2Result.value.params.length;

            switch (expression[0]) {
                case '=':
                    return ok(partialQuery(`${e1Result.value.text} = ${e2Result.value.text}`, params));
                case '!=':
                    return ok(partialQuery(`${e1Result.value.text} <> ${e2Result.value.text}`, params));
                case '>':
                    return ok(partialQuery(`${e1Result.value.text} > ${e2Result.value.text}`, params));
                case '>=':
                    return ok(partialQuery(`${e1Result.value.text} >= ${e2Result.value.text}`, params));
                case '<':
                    return ok(partialQuery(`${e1Result.value.text} < ${e2Result.value.text}`, params));
                case '<=':
                    return ok(partialQuery(`${e1Result.value.text} <= ${e2Result.value.text}`, params));
                case 'lk':
                    return ok(partialQuery(`${e1Result.value.text} LIKE ${e2Result.value.text}`, params));
                case '@>':
                    return ok(partialQuery(`${e1Result.value.text} @> ${e2Result.value.text}`, params));
                case '<@':
                    return ok(partialQuery(`${e1Result.value.text} <@ ${e2Result.value.text}`, params));
                case '?':
                    return ok(partialQuery(`${e1Result.value.text} ? ${e2Result.value.text}`, params));
                case 'j-':
                    return ok(partialQuery(`${e1Result.value.text} - ${e2Result.value.text}`, params));
            }
        case 'in':
        case 'nin':
        case 'lka':
        case 'lks':
        case '?|':
        case '?&':
        case 'j-a':
            e1Result = resolveExpression(expression[1], paramsStart, ignore);
            if (!e1Result.ok) {
                return err(`<${toDescription(expression[0])}>[first operand] -> ${e1Result.error}`);
            }
            if (e1Result.value.text === '') {
                return ignore ? ok(partialQuery())
                    : err(`<${toDescription(expression[0])}>[first operand] -> netural`);
            }
            params.push(...e1Result.value.params);
            paramsStart += e1Result.value.params.length;

            if (expression[2] === undefined) {
                return ignore ? ok(partialQuery())
                    : err(`<${toDescription(expression[0])}>[second operand] -> undefined`);
            }
            for (const v2 of expression[2] as any[]) {
                const v2Result = resolveExpression(v2, paramsStart, ignore);
                if (!v2Result.ok) {
                    return err(`<${toDescription(expression[0])}>[second operand][${(expression[2] as any[]).indexOf(v2)}] -> ${v2Result.error}`);
                }
                if (v2Result.value.text === '') {
                    if (ignore) {
                        continue;
                    } else {
                        return err(`<${toDescription(expression[0])}>[second operand][${(expression[1] as any[]).indexOf(v2)}] -> neutral`);
                    }
                }
                params.push(...v2Result.value.params);
                paramsStart += v2Result.value.params.length;

                tokens.push(v2Result.value.text);
            }

            switch (tokens.length) {
                case 0:
                    return ignore ? ok(partialQuery()) : err(`<${toDescription(expression[0])}>[second operand] -> empty`);
                case 1:
                    switch (expression[0]) {
                        case 'in':
                            return ok(partialQuery(`${e1Result.value.text} = ${tokens[0]}`, params));
                        case 'nin':
                            return ok(partialQuery(`${e1Result.value.text} <> ${tokens[0]}`, params));
                        case 'lka':
                            return ok(partialQuery(`${e1Result.value.text} LIKE ${tokens[0]}`, params));
                        case 'lks':
                            return ok(partialQuery(`${e1Result.value.text} LIKE ${tokens[0]}`, params));
                        case '?|':
                            return ok(partialQuery(`${e1Result.value.text} ? ${tokens[0]}`, params));
                        case '?&':
                            return ok(partialQuery(`${e1Result.value.text} ? ${tokens[0]}`, params));
                        case 'j-a':
                            return ok(partialQuery(`${e1Result.value.text} - ${tokens[0]}`, params));
                    }
                default:
                    switch (expression[0]) {
                        case 'in':
                            return ok(partialQuery(`${e1Result.value.text} IN ( ${tokens.join(', ')} )`, params));
                        case 'nin':
                            return ok(partialQuery(`${e1Result.value.text} NOT IN ( ${tokens.join(', ')} )`, params));
                        case 'lka':
                            return ok(partialQuery(`${e1Result.value.text} LIKE ALL( ARRAY[ ${tokens.join(', ')} ] )`, params));
                        case 'lks':
                            return ok(partialQuery(`${e1Result.value.text} LIKE SOME( ARRAY[ ${tokens.join(', ')} ] )`, params));
                        case '?|':
                            return ok(partialQuery(`${e1Result.value.text} ?| ARRAY[ ${tokens.join(', ')} ]`, params));
                        case '?&':
                            return ok(partialQuery(`${e1Result.value.text} ?& ARRAY[ ${tokens.join(', ')} ]`, params));
                        case 'j-a':
                            return ok(partialQuery(`${e1Result.value.text} - ARRAY[ ${tokens.join(', ')} ]`, params));
                    }
            }
        case 'bt':
            e1Result = resolveExpression(expression[1], paramsStart, ignore);
            if (!e1Result.ok) {
                return err(`<${toDescription(expression[0])}>[first operand] -> ${e1Result.error}`);
            }
            if (e1Result.value.text === '') {
                return ignore ? ok(partialQuery())
                    : err(`<${toDescription(expression[0])}>[first operand] -> netural`);
            }
            params.push(...e1Result.value.params);
            paramsStart += e1Result.value.params.length;

            e2Result = resolveExpression(expression[2], paramsStart, ignore);
            if (!e2Result.ok) {
                return err(`<${toDescription(expression[0])}>[second operand] -> ${e2Result.error}`);
            }
            if (e2Result.value.text === '') {
                return ignore ? ok(partialQuery())
                    : err(`<${toDescription(expression[0])}>[second operand] -> netural`);
            }
            params.push(...e2Result.value.params);
            paramsStart += e2Result.value.params.length;

            e3Result = resolveExpression(expression[3], paramsStart, ignore);
            if (!e3Result.ok) {
                return err(`<${toDescription(expression[0])}>[third operand] -> ${e3Result.error}`);
            }
            if (e3Result.value.text === '') {
                return ignore ? ok(partialQuery())
                    : err(`<${toDescription(expression[0])}>[third operand] -> netural`);
            }
            params.push(...e3Result.value.params);
            paramsStart += e3Result.value.params.length;

            return ok(partialQuery(`${e1Result.value.text} BETWEEN ${e2Result.value.text} AND ${e3Result.value.text}`, params));
        default:
            throw 'unexpected error. expect first element to be reserved key.';
    }
};

const getTableDataOfJoinSelectColumn = (tablesData: TableWithAlias[], column: string): TableWithAlias => {
    const splitColumn = column.split('_');
    if (splitColumn.length < 2) {
        throw `no separator`;
    }

    // in case alias or column key have "_". iterate on all of them until a match.
    let tableAliasUntilIndex = 1;
    while (true) {
        const tableAlias = splitColumn.slice(0, tableAliasUntilIndex).join('_');
        for (const tableData of tablesData) {
            if (tableData.alias === tableAlias && tableData.table.columns[splitColumn.slice(tableAliasUntilIndex).join('_')] !== undefined) {
                return tableData;
            }
        }
        if (splitColumn.length > tableAliasUntilIndex + 1) {
            tableAliasUntilIndex++;
        } else {
            throw `column not found`;
        }
    }
};

const resolveColumn = <T extends Table, C extends keyof T['columns'] & string>(table: T, column: C, full: boolean = true, alias?: string) => {
    let prefix: string;
    if (full) {
        if (alias !== undefined) {
            prefix = `"${alias}".`;
        } else {
            prefix = `"${table.schema}"."${table.title}".`;
        }
    } else {
        prefix = '';
    }
    return prefix + `"${table.columns[column].title ?? column}"`;
};

const partialQuery = (text: string = '', params: Param[] = []): PartialQuery => ({text, params});

export {
    createEntity,
    createJoinSelectEntity
};
export {
    ReservedExpressionKeys,
    createQueryResult,
    resolveResult,
    resolveReturning,
    resolveExpression,
    getTableDataOfJoinSelectColumn,
    resolveColumn,
    partialQuery
};
