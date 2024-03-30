import Decimal from 'decimal.js';
import { Query } from './entity';
import { resolveColumn } from './resolve';
import { Json, NullableType, Schema, Table } from './Table';
import {
    OperatorMap,
    JsonOperator,
    LikeOperator,
    ListOperator,
    NullOperator,
    OperatorCode,
    BetweenOperator,
    BooleanOperator,
    CompareOperator,
    ArithmeticOperator,
    JsonCompareOperator
} from './keywords';

const value = <T>(expression: T): T =>
    [OperatorCode.Value, expression] as unknown as T;

function arithmetic<T extends undefined | null | number>(
    expressionA: T,
    operator: ArithmeticOperator,
    expressionB: T
): Extract<T, undefined | null> | (T extends number ? number : never);
function arithmetic<T extends undefined | null | bigint>(
    expressionA: T,
    operator: ArithmeticOperator,
    expressionB: T
): Extract<T, undefined | null> | (T extends bigint ? bigint : never);
function arithmetic<T extends undefined | null | Decimal>(
    expressionA: T,
    operator: ArithmeticOperator,
    expressionB: T
): Extract<T, undefined | null> | (T extends Decimal ? Decimal : never);
function arithmetic<T extends undefined | null | number>(
    operator: ArithmeticOperator,
    expressions: readonly T[],
    _?: never
): Extract<T, undefined | null> | (T extends number ? number : never);
function arithmetic<T extends undefined | null | bigint>(
    operator: ArithmeticOperator,
    expressions: readonly T[],
    _?: never
): Extract<T, undefined | null> | (T extends bigint ? bigint : never);
function arithmetic<T extends undefined | null | Decimal>(
    operator: ArithmeticOperator,
    expressions: readonly T[],
    _?: never
): Extract<T, undefined | null> | (T extends Decimal ? Decimal : never);
function arithmetic(a: unknown, b: unknown, c: unknown) {
    return Array.isArray(b)
        ? [OperatorMap[a as ArithmeticOperator], b]
        : [OperatorMap[b as ArithmeticOperator], [a, c]];
}

function json<
    T extends undefined | Json,
    K extends undefined | null | number | string
>(
    expression: T,
    operator: '->',
    key: K,
    _?: never
):
    | (undefined extends K ? undefined : never)
    | (undefined extends T ? undefined : never)
    | (null extends K ? null : never)
    | (T extends Json ? Json : never);
function json<
    T extends undefined | Json,
    K extends undefined | null | number | string,
    C extends undefined | string = undefined
>(
    expression: T,
    operator: '->>',
    key: K,
    cast?: C
):
    | (undefined extends K ? undefined : never)
    | (undefined extends T ? undefined : never)
    | (null extends K ? null : never)
    | (C extends string ? unknown : T extends Json ? string : never);
function json<T extends undefined | Json, B extends undefined | null | string>(
    expressionA: T,
    operator: 'j-',
    expressionB: B,
    _?: never
):
    | (undefined extends B ? undefined : never)
    | (null extends B ? null | Partial<T> : Partial<T>);
function json<
    T extends undefined | null | Json,
    B extends undefined | null | string
>(
    expressionA: T,
    operator: 'j- Array',
    expressionB: readonly B[],
    _?: never
):
    | (undefined extends B ? undefined : never)
    | (null extends T ? null | Partial<T> : Partial<T>);
function json(
    a: unknown,
    operator: JsonOperator,
    b: unknown,
    c: unknown
): unknown {
    return [OperatorMap[operator], a, b, c];
}

// use "as" for casting, generic approach is not possible due to undefined arguments
const fun = (
    name: string,
    args: readonly unknown[],
    cast: string = ''
): unknown => [OperatorCode.Function, name, args, cast];

const switchCase = <W extends undefined | boolean, T>(
    cases: readonly {
        when: W;
        then: T;
    }[],
    otherwise?: T
): undefined extends W ? undefined | T : T =>
    [OperatorCode.SwitchCase, cases, otherwise] as unknown as T;

function concat<T extends undefined | null | string>(
    ...expressions: T[]
): Extract<T, undefined | null> | (T extends string ? string : never);
function concat<T extends undefined | null | Json>(
    ...expressions: T[]
): Extract<T, undefined | null> | (T extends Json ? Json : never);
function concat(...a: unknown[]) {
    return [OperatorCode.Concat, a];
}

const column = <S extends Schema, C extends keyof S & string>(
    table: Table<S>,
    column: C,
    full?: boolean,
    alias?: string
): NullableType<S[C]['type'], S[C]['nullable']> => [
    OperatorCode.Column,
    resolveColumn(table, column, full, alias)
];

const raw = <T>(
    get: (paramsStart: number) => {
        expression: string;
        params: string[];
    }
): T => [OperatorCode.Raw, get] as unknown as T;

const ignore = <T>(
    expression: T,
    otherwise: Exclude<T, undefined>
): Exclude<T, undefined> =>
    [OperatorCode.Ignore, expression, otherwise] as Exclude<T, undefined>;

const not = <T extends undefined | null | boolean>(expression: T): T =>
    [OperatorCode.Not, expression] as unknown as T;

const and = <T extends undefined | null | boolean>(
    ...expressions: readonly T[]
): T => [OperatorCode.And, expressions] as unknown as T;

const or = <T extends undefined | null | boolean>(
    ...expressions: readonly T[]
): T => [OperatorCode.Or, expressions] as unknown as T;

function compare<T>(
    expression: T,
    operator: null extends T ? NullOperator : never,
    _?: never,
    __?: never
): undefined extends T ? undefined | boolean : boolean;
function compare<T extends undefined | null | boolean>(
    expression: T,
    operator: BooleanOperator,
    _?: never,
    __?: never
): T;
function compare<T extends undefined | null | number>(
    expressionA: T,
    operator: CompareOperator,
    expressionB: T,
    _?: never
): Extract<T, undefined | null> | (T extends number ? boolean : never);
function compare<T extends undefined | null | bigint>(
    expressionA: T,
    operator: CompareOperator,
    expressionB: T,
    _?: never
): Extract<T, undefined | null> | (T extends bigint ? boolean : never);
function compare<T extends undefined | null | Decimal>(
    expressionA: T,
    operator: CompareOperator,
    expressionB: T,
    _?: never
): Extract<T, undefined | null> | (T extends Decimal ? boolean : never);
function compare<T extends undefined | null | string>(
    expressionA: T,
    operator: CompareOperator,
    expressionB: T,
    _?: never
): Extract<T, undefined | null> | (T extends string ? boolean : never);
function compare<T extends undefined | null | Date>(
    expressionA: T,
    operator: CompareOperator,
    expressionB: T,
    _?: never
): Extract<T, undefined | null> | (T extends Date ? boolean : never);
function compare<T extends undefined | null | number>(
    expressionA: T,
    operator: ListOperator,
    expressions: readonly T[],
    _?: never
): Extract<T, undefined | null> | (T extends number ? boolean : never);
function compare<T extends undefined | null | bigint>(
    expressionA: T,
    operator: ListOperator,
    expressions: readonly T[],
    _?: never
): Extract<T, undefined | null> | (T extends bigint ? boolean : never);
function compare<T extends undefined | null | Decimal>(
    expressionA: T,
    operator: ListOperator,
    expressions: readonly T[],
    _?: never
): Extract<T, undefined | null> | (T extends Decimal ? boolean : never);
function compare<T extends undefined | null | string>(
    expressionA: T,
    operator: ListOperator,
    expressions: readonly T[],
    _?: never
): Extract<T, undefined | null> | (T extends string ? boolean : never);
function compare<T extends undefined | null | Date>(
    expressionA: T,
    operator: ListOperator,
    expressions: readonly T[],
    _?: never
): Extract<T, undefined | null> | (T extends Date ? boolean : never);
function compare<T extends undefined | null | string>(
    expressionA: T,
    operator: 'like',
    expressionB: T,
    _?: never
): Extract<T, undefined | null> | (T extends string ? boolean : never);
function compare<T extends undefined | null | string>(
    expressionA: T,
    operator: Exclude<LikeOperator, 'like'>,
    expressions: readonly T[],
    _?: never
): Extract<T, undefined | null> | (T extends string ? boolean : never);
function compare<T extends undefined | null | number>(
    expression: T,
    operator: BetweenOperator,
    expressionStart: T,
    expressionEnd: T
): Extract<T, undefined | null> | (T extends number ? boolean : never);
function compare<T extends undefined | null | bigint>(
    expression: T,
    operator: BetweenOperator,
    expressionStart: T,
    expressionEnd: T
): Extract<T, undefined | null> | (T extends bigint ? boolean : never);
function compare<T extends undefined | null | Decimal>(
    expression: T,
    operator: BetweenOperator,
    expressionStart: T,
    expressionEnd: T
): Extract<T, undefined | null> | (T extends Decimal ? boolean : never);
function compare<T extends undefined | null | string>(
    expression: T,
    operator: BetweenOperator,
    expressionStart: T,
    expressionEnd: T
): Extract<T, undefined | null> | (T extends string ? boolean : never);
function compare<T extends undefined | null | Date>(
    expression: T,
    operator: BetweenOperator,
    expressionStart: T,
    expressionEnd: T
): Extract<T, undefined | null> | (T extends Date ? boolean : never);
function compare<T extends undefined | null | Json>(
    expressionA: T,
    operator: '@>' | '<@',
    expressionB: T,
    _?: never
): Extract<T, undefined | null> | (T extends Json ? boolean : never);
function compare<
    T extends undefined | null | Json,
    B extends undefined | null | string
>(
    expressionA: T,
    operator: '?',
    expressionB: B,
    _?: never
):
    | Extract<T, undefined | null>
    | Extract<B, undefined | null>
    | (T extends Json ? (B extends string ? boolean : never) : never);
function compare<
    T extends undefined | null | Json,
    B extends undefined | null | string
>(
    expressionA: T,
    operator: '?&' | '?|',
    expressions: readonly B[],
    _?: never
):
    | Extract<T, undefined | null>
    | Extract<B, undefined | null>
    | (T extends Json ? (B extends string ? boolean : never) : never);
function compare(
    a: unknown,
    operator:
        | NullOperator
        | BooleanOperator
        | CompareOperator
        | ListOperator
        | LikeOperator
        | BetweenOperator
        | JsonCompareOperator,
    b: unknown,
    c: unknown
): unknown {
    return [OperatorMap[operator], a, b, c];
}

const subQuery = <T>(query: Query<Schema, []>): T =>
    [OperatorCode.SubQuery, query] as T;

const subQueryExist = <T>(query: Query<Schema, []>): T =>
    [OperatorCode.SubQueryExist, query] as T;

const stringify = (value: unknown, inline = false): string => {
    switch (typeof value) {
        case 'boolean':
            return value ? 'TRUE' : 'FALSE';
        case 'number':
        case 'bigint':
            return `${value}`;
        case 'string':
            return inline ? `'${value}'` : `${value}`;
        case 'object':
            if (value === null) {
                return 'NULL';
            }
            if (value instanceof Decimal) {
                return inline ? `'${value}'` : `${value}`;
            }
            if (value instanceof Date) {
                return inline
                    ? `'${value.toISOString()}'`
                    : value.toISOString();
            }
            return inline
                ? `'${JSON.stringify(value)}'::JSONB`
                : JSON.stringify(value);
        case 'undefined':
        case 'function':
        case 'symbol':
            throw `${String(value)} is not serializable`;
    }
};

const Cast = {
    boolean: <N extends boolean = false>(
        v: unknown,
        nullable = false as N
    ): NullableType<boolean, N> | undefined => {
        if (
            nullable &&
            (v === null ||
                (typeof v === 'string' && v.toLowerCase() === 'null'))
        ) {
            return null as NullableType<boolean, N>;
        }
        switch (typeof v) {
            case 'boolean':
                return v;
            case 'string':
                switch (v) {
                    case 't':
                    case 'true':
                        return true;
                    case 'f':
                    case 'false':
                        return false;
                    default:
                        return undefined;
                }
            default:
                return undefined;
        }
    },
    number: <N extends boolean = false>(
        v: unknown,
        nullable = false as N
    ): NullableType<number, N> | undefined => {
        if (
            nullable &&
            (v === null ||
                (typeof v === 'string' && v.toLowerCase() === 'null'))
        ) {
            return null as NullableType<number, N>;
        }
        if (typeof v === 'number') {
            return v;
        } else if (typeof v === 'string') {
            const _v = Number(v);
            return Number.isNaN(_v) ? undefined : _v;
        } else {
            return undefined;
        }
    },
    integer: <N extends boolean = false>(
        v: unknown,
        nullable = false as N
    ): NullableType<number, N> | undefined => {
        const _v = Cast.number(v, nullable);
        return typeof _v === 'number' ? Math.trunc(_v) : _v;
    },
    bigInt: <N extends boolean = false>(
        v: unknown,
        nullable = false as N
    ): NullableType<bigint, N> | undefined => {
        if (
            nullable &&
            (v === null ||
                (typeof v === 'string' && v.toLowerCase() === 'null'))
        ) {
            return null as NullableType<bigint, N>;
        }
        switch (typeof v) {
            case 'bigint':
                return v;
            case 'number':
                return BigInt(v);
            case 'string':
                try {
                    return BigInt(v);
                } catch (_) {
                    return undefined;
                }
            default:
                return undefined;
        }
    },
    decimal: <N extends boolean = false>(
        v: unknown,
        nullable = false as N
    ): NullableType<Decimal, N> | undefined => {
        if (
            nullable &&
            (v === null ||
                (typeof v === 'string' && v.toLowerCase() === 'null'))
        ) {
            return null as NullableType<Decimal, N>;
        }
        if (v instanceof Decimal) {
            return v;
        }
        switch (typeof v) {
            case 'number':
                return new Decimal(v);
            case 'string':
                try {
                    return new Decimal(v);
                } catch (_) {
                    return undefined;
                }
            default:
                return undefined;
        }
    },
    string: <N extends boolean = false>(
        v: unknown,
        nullable = false as N
    ): NullableType<string, N> | undefined => {
        if (
            nullable &&
            (v === null ||
                (typeof v === 'string' && v.toLowerCase() === 'null'))
        ) {
            return null as NullableType<string, N>;
        }
        switch (typeof v) {
            case 'boolean':
            case 'number':
            case 'bigint':
                return `${v}`;
            case 'string':
                return v;
            default:
                return undefined;
        }
    },
    date: <N extends boolean = false>(
        v: unknown,
        nullable = false as N
    ): NullableType<Date, N> | undefined => {
        if (
            nullable &&
            (v === null ||
                (typeof v === 'string' && v.toLowerCase() === 'null'))
        ) {
            return null as NullableType<Date, N>;
        }
        if (v instanceof Date) {
            return v;
        }
        if (typeof v === 'number' || typeof v === 'string') {
            const _v = new Date(v);
            return `${_v}` === 'Invalid Date' ? undefined : _v;
        } else {
            return undefined;
        }
    },
    json: <N extends boolean = false>(
        v: unknown,
        nullable = false as N
    ): NullableType<Json, N> | undefined => {
        if (
            nullable &&
            (v === null ||
                (typeof v === 'string' && v.toLowerCase() === 'null'))
        ) {
            return null as NullableType<Json, N>;
        }
        const _v = typeof v !== 'string' ? JSON.stringify(v) : v;
        try {
            const parsedV = JSON.parse(_v);
            if (typeof parsedV !== 'object' || parsedV === null) {
                return undefined;
            }
            return parsedV;
        } catch (_) {
            return undefined;
        }
    }
};

export {
    value,
    arithmetic,
    json,
    fun,
    switchCase,
    concat,
    column,
    raw,
    ignore,
    not,
    and,
    or,
    compare,
    subQuery,
    subQueryExist,
    stringify,
    Cast
};
