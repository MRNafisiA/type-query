import Decimal from 'decimal.js';
import type { Json } from './Json';
import type { Table } from './Table';
import {
    ColumnTypeByColumns,
    ColumnTypeWithoutCustomTypeWithoutNullByColumns,
    ColumnTypeWithoutNullByColumns,
    CustomTypeMap
} from './TypeMapper';

type Context<Columns extends Table['columns'], CTypeMap extends CustomTypeMap<Columns>> = {
    col: <columnKey extends keyof Columns & string>(
        column: columnKey,
        alias?: string
    ) => ColumnTypeByColumns<Columns, columnKey, CTypeMap>;
    colNull: <columnKey extends keyof Columns & string>(
        column: columnKey,
        op: true extends Columns[columnKey]['nullable'] ? NullOperator : never,
        alias?: string
    ) => boolean;
    colBool: <columnKey extends keyof Columns & string>(
        column: columnKey,
        op: ColumnTypeWithoutNullByColumns<Columns, columnKey, CTypeMap> extends boolean ? BooleanOperator : never,
        alias?: string
    ) => boolean;
    colCmp: <columnKey extends keyof Columns & string>(
        column: columnKey,
        op: CompareOperatorCompatible<
            ColumnTypeWithoutNullByColumns<Columns, columnKey, CTypeMap>,
            CompareOperator,
            never
        >,
        v: ColumnTypeWithoutNullByColumns<Columns, columnKey, CTypeMap>,
        alias?: string
    ) => boolean;
    colList: <columnKey extends keyof Columns & string>(
        column: columnKey,
        op: ListOperatorCompatible<ColumnTypeWithoutNullByColumns<Columns, columnKey, CTypeMap>, ListOperator, never>,
        v: readonly ColumnTypeWithoutNullByColumns<Columns, columnKey, CTypeMap>[],
        alias?: string
    ) => boolean;
    colLike: <
        columnKey extends keyof Columns & string,
        Op extends ColumnTypeWithoutNullByColumns<Columns, columnKey, CTypeMap> extends string ? LikeOperator : never
    >(
        column: columnKey,
        op: Op,
        v: Op extends 'like'
            ? ColumnTypeWithoutCustomTypeWithoutNullByColumns<Columns, columnKey> // value: 'hello', like 'hel'
            : readonly ColumnTypeWithoutCustomTypeWithoutNullByColumns<Columns, columnKey>[],
        alias?: string
    ) => boolean;
    colJson: <
        columnKey extends keyof Columns & string,
        Op extends ColumnTypeWithoutNullByColumns<Columns, columnKey, CTypeMap> extends Json ? JsonOperator : never
    >(
        column: columnKey,
        op: Op,
        v: Op extends '@>' | '<@'
            ? ColumnTypeWithoutNullByColumns<Columns, columnKey, CTypeMap>
            : Op extends '?'
            ? string
            : Op extends '?&' | '?|'
            ? readonly string[]
            : never,
        alias?: string
    ) => boolean;
    colsAnd: ContextScope<Columns, CTypeMap>;
    colsOr: ContextScope<Columns, CTypeMap>;
};

type ContextScope<Columns extends Table['columns'], CTypeMap extends CustomTypeMap<Columns>> = (
    rules: {
        [columnKey in keyof Columns]?:
            | [op: true extends Columns[columnKey]['nullable'] ? NullOperator : never]
            | [
                  op: ColumnTypeWithoutNullByColumns<Columns, columnKey, CTypeMap> extends boolean
                      ? BooleanOperator
                      : never
              ]
            | [
                  op: CompareOperatorCompatible<
                      ColumnTypeWithoutNullByColumns<Columns, columnKey, CTypeMap>,
                      CompareOperator,
                      never
                  >,
                  v: ColumnTypeWithoutNullByColumns<Columns, columnKey, CTypeMap>
              ]
            | [
                  op: ListOperatorCompatible<
                      ColumnTypeWithoutNullByColumns<Columns, columnKey, CTypeMap>,
                      ListOperator,
                      never
                  >,
                  v: readonly ColumnTypeWithoutNullByColumns<Columns, columnKey, CTypeMap>[]
              ]
            | [
                  op: Extract<LikeOperator, 'like'>,
                  v: ColumnTypeWithoutNullByColumns<Columns, columnKey, CTypeMap> extends string
                      ? ColumnTypeWithoutCustomTypeWithoutNullByColumns<Columns, columnKey>
                      : never
              ]
            | [
                  op: Extract<LikeOperator, 'like some' | 'like all'>,
                  v: ColumnTypeWithoutNullByColumns<Columns, columnKey, CTypeMap> extends string
                      ? readonly ColumnTypeWithoutCustomTypeWithoutNullByColumns<Columns, columnKey>[]
                      : never
              ]
            | [
                  op: Extract<JsonOperator, '@>' | '<@'>,
                  v: ColumnTypeWithoutNullByColumns<Columns, columnKey, CTypeMap> extends Json
                      ? ColumnTypeWithoutNullByColumns<Columns, columnKey, CTypeMap>
                      : never
              ]
            | [
                  op: Extract<JsonOperator, '?'>,
                  v: ColumnTypeWithoutNullByColumns<Columns, columnKey, CTypeMap> extends Json ? string : never
              ]
            | [
                  op: Extract<JsonOperator, '?&' | '?|'>,
                  v: ColumnTypeWithoutNullByColumns<Columns, columnKey, CTypeMap> extends Json
                      ? readonly string[]
                      : never
              ];
    },
    alias?: string
) => boolean;

type CompareOperatorCompatible<T, True, False> = T extends number
    ? True
    : T extends bigint
    ? True
    : T extends Decimal
    ? True
    : T extends string
    ? True
    : T extends Date
    ? True
    : False;
type ListOperatorCompatible<T, True, False> = T extends number
    ? True
    : T extends bigint
    ? True
    : T extends Decimal
    ? True
    : T extends string
    ? True
    : T extends Date
    ? True
    : False;

type NullOperator = '= null' | '!= null';
type BooleanOperator = '= true' | '= false';
type CompareOperator = '=' | '!=' | '>' | '>=' | '<' | '<=';
type ListOperator = 'in' | 'not in';
type LikeOperator = 'like' | 'like all' | 'like some';
type JsonOperator = '?' | '@>' | '<@' | '?|' | '?&';
type ArithmeticOperator = '+' | '-' | '*' | '/' | '**';

export type { Context, CompareOperatorCompatible, ListOperatorCompatible, ContextScope };
export type {
    NullOperator,
    BooleanOperator,
    CompareOperator,
    ListOperator,
    LikeOperator,
    JsonOperator,
    ArithmeticOperator
};
