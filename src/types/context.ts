import Decimal from 'decimal.js';
import type Table from './table';
import type {JSON} from './json';
import type {ColumnTypeByColumns} from './postgres';
import type {Expression, ValueExpression} from './entity';

type Context<Columns extends Table['columns']> = {
    col: <columnKey extends keyof Columns & string>(column: columnKey, alias?: string) => ValueExpression<ColumnTypeByColumns<Columns, columnKey>>;
    colNull: <columnKey extends keyof Columns & string>(column: columnKey, op: null extends ColumnTypeByColumns<Columns, columnKey> ? NullOperator : never, alias?: string) => ValueExpression<boolean>;
    colBool: <columnKey extends keyof Columns & string>(column: columnKey, op: boolean extends ColumnTypeByColumns<Columns, columnKey> ? BooleanOperator : never, alias?: string) => ValueExpression<boolean>;
    colCmp: <columnKey extends keyof Columns & string>(column: columnKey, op: CompareOperatorCompatible<ColumnTypeByColumns<Columns, columnKey>, CompareOperator, never>, v: Expression<ColumnTypeByColumns<Columns, columnKey>>, alias?: string) => ValueExpression<boolean>;
    colList: <columnKey extends keyof Columns & string>(column: columnKey, op: ListOperatorCompatible<ColumnTypeByColumns<Columns, columnKey>, ListOperator, never>, v: readonly Expression<ColumnTypeByColumns<Columns, columnKey>>[] | undefined, alias?: string) => ValueExpression<boolean>;
    colLike: <columnKey extends keyof Columns & string, Op extends (string extends ColumnTypeByColumns<Columns, columnKey> ? LikeOperator : never)>(column: columnKey, op: Op, v: Op extends 'like' ? Expression<ColumnTypeByColumns<Columns, columnKey>> : readonly Expression<ColumnTypeByColumns<Columns, columnKey>>[] | undefined, alias?: string) => ValueExpression<boolean>;
    colJson: <columnKey extends keyof Columns & string, Op extends (JSON extends ColumnTypeByColumns<Columns, columnKey> ? JsonOperator : never)>(column: columnKey, op: Op, v: Op extends '@>' | '<@' ? Expression<ColumnTypeByColumns<Columns, columnKey>> : Op extends '?' ? Expression<string> : Op extends '?&' | '?|' ? readonly Expression<string>[] | undefined : never, alias?: string) => ValueExpression<boolean>;
    colsAnd: ContextScope<Columns>;
    colsOr: ContextScope<Columns>;
};

type ContextScope<Columns extends Table['columns']> = (rules: {
    [columnKey in keyof Columns]?:
    [op: null extends ColumnTypeByColumns<Columns, columnKey> ? NullOperator : never] |
    [op: ColumnTypeByColumns<Columns, columnKey> extends boolean ? BooleanOperator : never] |
    [op: CompareOperatorCompatible<ColumnTypeByColumns<Columns, columnKey>, CompareOperator, never>, v: Expression<ColumnTypeByColumns<Columns, columnKey>>] |
    [op: ListOperatorCompatible<ColumnTypeByColumns<Columns, columnKey>, ListOperator, never>, v: readonly Expression<ColumnTypeByColumns<Columns, columnKey>>[] | undefined] |
    [op: Extract<LikeOperator, 'like'>, v: ColumnTypeByColumns<Columns, columnKey> extends string ? Expression<ColumnTypeByColumns<Columns, columnKey>> : never] |
    [op: Extract<LikeOperator, 'like some' | 'like all'>, v: ColumnTypeByColumns<Columns, columnKey> extends string ? readonly Expression<ColumnTypeByColumns<Columns, columnKey>>[] | undefined : never] |
    [op: Extract<JsonOperator, '@>' | '<@'>, v: ColumnTypeByColumns<Columns, columnKey> extends JSON ? Expression<ColumnTypeByColumns<Columns, columnKey>> : never] |
    [op: Extract<JsonOperator, '?'>, v: ColumnTypeByColumns<Columns, columnKey> extends JSON ? Expression<string> : never] |
    [op: Extract<JsonOperator, '?&' | '?|'>, v: ColumnTypeByColumns<Columns, columnKey> extends JSON ? readonly Expression<string>[] | undefined : never];
}, alias?: string) => ValueExpression<boolean>;

type CompareOperatorCompatible<T, True, False> =
    number extends T ? True
        : bigint extends T ? True
            : Decimal extends T ? True
                : string extends T ? True
                    : Date extends T ? True
                        : False;
type ListOperatorCompatible<T, True, False> =
    number extends T ? True
        : bigint extends T ? True
            : Decimal extends T ? True
                : string extends T ? True
                    : Date extends T ? True
                        : False;

type ArithmeticOperator = '+' | '-' | '*' | '/' | '**';
type NullOperator = '= null' | '!= null';
type BooleanOperator = '= true' | '= false';
type CompareOperator = '=' | '!=' | '>' | '>=' | '<' | '<=';
type ListOperator = 'in' | 'not in';
type LikeOperator = 'like' | 'like all' | 'like some';
type JsonOperator = '?' | '@>' | '<@' | '?|' | '?&';

export type {
    Context,
    CompareOperatorCompatible,
    ListOperatorCompatible,
    ContextScope
};
export type {
    ArithmeticOperator,
    NullOperator,
    BooleanOperator,
    CompareOperator,
    ListOperator,
    LikeOperator,
    JsonOperator
};