import { Json } from './Json';
import Decimal from 'decimal.js';
import { Context } from './Context';
import type { Table } from './Table';
import type { ClientBase } from 'pg';
import type { Result } from 'never-catch';
import { ColumnTypeByColumns, CustomTypeMap } from './TypeMapper';

type Expression = null | boolean | number | bigint | Decimal | string | Date | Json;

type JoinType = 'inner' | 'left' | 'right' | 'full';

type Param = number | bigint | string;

type QueryData = {
    sql: string;
    params: Param[];
};

type TableWithAlias = {
    table: Table;
    alias: string;
};

type JoinData = {
    joinType: JoinType;
    on: boolean | ((contexts: { [k: string]: Context<Table['columns'], CustomTypeMap<any>> }) => boolean);
};

type Mode = [] | ['count', number] | ['get', 'one' | number];

type CustomColumn<Exp extends Expression, As extends string> = {
    exp: Exp;
    as: As;
};

type NullableAndDefaultColumns<Columns extends Table['columns']> = {
    [columnKey in keyof Columns as true extends Columns[columnKey]['nullable']
        ? columnKey
        : false extends Columns[columnKey]['default']
        ? never
        : columnKey]: true extends Columns[columnKey]['nullable']
        ? Columns[columnKey]
        : false extends Columns[columnKey]['default']
        ? never
        : Columns[columnKey];
};

type AliasedColumns<Columns extends Record<string, unknown>, Alias extends string> = {
    [key in keyof Columns as `${Alias}_${key & string}`]: Columns[key];
};

type TablesColumnsKeys<
    Tables extends {
        [key: string]: Table;
    }
> = {
    [tableKey in keyof Tables & string]: `${tableKey}_${keyof Tables[tableKey]['columns'] & string}`;
}[keyof {
    [tableKey in keyof Tables & string]: undefined;
}];

type InsertValue<
    Columns extends Table['columns'],
    NullableAndDefaultCols extends readonly (keyof NullableAndDefaultColumns<Columns>)[],
    CTypeMap extends CustomTypeMap<Columns>
> = {
    [columnKey in Exclude<keyof Columns, keyof NullableAndDefaultColumns<Columns>>]: ColumnTypeByColumns<
        Columns,
        columnKey,
        CTypeMap
    >;
} & {
    [columnKey in Exclude<keyof NullableAndDefaultCols, keyof unknown[]> as NullableAndDefaultCols[columnKey] &
        string]?: ColumnTypeByColumns<Columns, NullableAndDefaultCols[columnKey] & string, CTypeMap>;
};

type UpdateSets<Columns extends Table['columns'], CTypeMap extends CustomTypeMap<Columns>> = {
    [columnKey in keyof Columns & string]?: ColumnTypeByColumns<Columns, columnKey, CTypeMap>;
};

type Query<
    Columns extends Table['columns'],
    Returning extends readonly (keyof Columns | CustomColumn<Expression, string>)[],
    CTypeMap extends CustomTypeMap<Columns>
> = {
    getData: (params?: Param[]) => Result<QueryData, string>;
    exec: <M extends Mode>(
        client: ClientBase,
        mode: M,
        params?: Param[]
    ) => Promise<Result<QueryResult<Columns, Returning, CTypeMap, M>, unknown>>;
};

type QueryResult<
    Columns extends Table['columns'],
    Returning extends readonly (keyof Columns | CustomColumn<Expression, string>)[],
    CTypeMap extends CustomTypeMap<Columns>,
    M extends Mode
> = M extends ['get', 'one']
    ? QueryResultRow<Columns, Returning, CTypeMap>
    : M extends ['get', number] | []
    ? QueryResultRow<Columns, Returning, CTypeMap>[]
    : M extends ['count', number]
    ? undefined
    : never;

type QueryResultRow<
    Columns extends Table['columns'],
    Returning extends readonly (keyof Columns | CustomColumn<Expression, string>)[],
    CTypeMap extends CustomTypeMap<Columns>
> = {
    [key in Exclude<keyof Returning, keyof unknown[]> as Returning[key] extends CustomColumn<Expression, infer As>
        ? As
        : Returning[key] & string]: Returning[key] extends CustomColumn<infer Exp, string>
        ? Exp
        : ColumnTypeByColumns<Columns, Returning[key] & keyof Columns, CTypeMap>;
};

type PartialQuery = {
    text: string;
    params: Param[];
};

export type {
    Expression,
    JoinType,
    Param,
    QueryData,
    TableWithAlias,
    JoinData,
    Mode,
    CustomColumn,
    NullableAndDefaultColumns,
    AliasedColumns,
    TablesColumnsKeys,
    InsertValue,
    UpdateSets,
    Query,
    QueryResult,
    QueryResultRow,
    PartialQuery
};
