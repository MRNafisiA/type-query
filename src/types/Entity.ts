import { JSON } from './Json';
import Decimal from 'decimal.js';
import type { Table } from './Table';
import { Context } from './Context';
import type { ClientBase } from 'pg';
import type { Result } from 'never-catch';
import type { ColumnTypeByColumns } from './postgres';

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
    on: Expression<boolean> | ((contexts: { [k: string]: Context<Table['columns']> }) => Expression<boolean>);
};
type Mode = [] | ['count', number] | ['get', 'one' | number];

type CustomColumn<Exp extends Expression<ExpressionTypes>, As extends string> = {
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
type AliasedColumns<Columns extends Table['columns'], Alias extends string> = {
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

type ExpressionTypes = null | boolean | number | bigint | Decimal | string | Date | JSON;
type Expression<ExpType extends ExpressionTypes> =
    | ExpType
    | undefined
    | ValueExpression<ExpType>
    | QueryExpression<ExpType>;
type ValueExpression<ExpType extends ExpressionTypes> = ['val', ExpType | undefined];
type QueryExpression<ExpType extends ExpressionTypes> = ['qry', ExpType];

type InsertValue<
    Columns extends Table['columns'],
    NullableAndDefaultCols extends readonly (keyof NullableAndDefaultColumns<Columns>)[]
> = {
    [columnKey in Exclude<keyof Columns, keyof NullableAndDefaultColumns<Columns>>]: Expression<
        ColumnTypeByColumns<Columns, columnKey>
    >;
} & {
    [columnKey in Exclude<keyof NullableAndDefaultCols, keyof unknown[]> as NullableAndDefaultCols[columnKey] &
        string]?: Expression<ColumnTypeByColumns<Columns, NullableAndDefaultCols[columnKey] & string>>;
};
type UpdateSets<Columns extends Table['columns']> = {
    [columnKey in keyof Columns & string]?: Expression<ColumnTypeByColumns<Columns, columnKey>>;
};

type Query<
    Columns extends Table['columns'],
    Returning extends readonly (keyof Columns | CustomColumn<Expression<ExpressionTypes>, string>)[]
> = {
    getData: (params?: Param[]) => Result<QueryData, string>;
    exec: <M extends Mode>(
        client: ClientBase,
        mode: M,
        params?: Param[]
    ) => Promise<Result<QueryResult<Columns, Returning, M>, unknown>>;
};
type QueryResult<
    Columns extends Table['columns'],
    Returning extends readonly (keyof Columns | CustomColumn<Expression<ExpressionTypes>, string>)[],
    M extends Mode
> = M extends ['get', 'one']
    ? QueryResultRow<Columns, Returning>
    : M extends ['get', number] | []
    ? QueryResultRow<Columns, Returning>[]
    : M extends ['count', number]
    ? undefined
    : never;
type QueryResultRow<
    Columns extends Table['columns'],
    Returning extends readonly (keyof Columns | CustomColumn<Expression<ExpressionTypes>, string>)[]
> = {
    [key in Exclude<keyof Returning, keyof unknown[]> as Returning[key] extends CustomColumn<
        Expression<ExpressionTypes>,
        infer As
    >
        ? As
        : Returning[key] & string]: Returning[key] extends CustomColumn<infer Exp, string>
        ? Exp extends Expression<infer ExpType>
            ? ExpType
            : Exp
        : ColumnTypeByColumns<Columns, Returning[key] & keyof Columns>;
};
type PartialQuery = {
    text: string;
    params: Param[];
};

export type { JoinType, Param, QueryData, TableWithAlias, JoinData, Mode };
export type { CustomColumn, NullableAndDefaultColumns, AliasedColumns, TablesColumnsKeys };
export type { ExpressionTypes, Expression, ValueExpression, QueryExpression };
export type { InsertValue, UpdateSets };
export type { Query, QueryResult, QueryResultRow, PartialQuery };
