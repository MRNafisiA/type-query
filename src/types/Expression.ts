import {JsonValue} from './JSON';

type ExpressionTypes = null | boolean | number | bigint | string | Date | JsonValue;
type Expression<T extends ExpressionTypes> =
    StaticExpression<T>
    | DynamicExpression<T>
    | RawExpression<T>
    | undefined;

type StaticExpression<T extends ExpressionTypes> = T extends null
    ? NullExpression
    : T extends boolean
        ? BooleanExpression
        : T extends number
            ? NumberExpression
            : T extends bigint
                ? BigIntExpression
                : T extends string
                    ? StringExpression
                    : T extends Date
                        ? DateExpression
                        : T extends JsonValue
                            ? JsonExpression
                            : never;

type DynamicExpression<T extends ExpressionTypes> = SwitchExpression<T>;

type NullExpression =
    ValueExpression<null>
    | FunctionExpression<null>
    | ColumnExpression<null>;

type BooleanExpression =
    | NotScope<boolean>
    | AndScope<boolean>
    | OrScope<boolean>
    | Operators
    | ValueExpression<boolean>
    | NotExpression<boolean>
    | FunctionExpression<boolean>
    | ColumnExpression<boolean>;

type NumberExpression =
    ValueExpression<number>
    | PlusExpression<number>
    | MinusExpression<number>
    | MultiplyExpression<number>
    | DivideExpression<number>
    | PowerExpression<number>
    | FunctionExpression<number>
    | ColumnExpression<number>;

type BigIntExpression =
    ValueExpression<bigint>
    | PlusExpression<bigint>
    | MinusExpression<bigint>
    | MultiplyExpression<bigint>
    | DivideExpression<bigint>
    | PowerExpression<bigint>
    | FunctionExpression<bigint>
    | ColumnExpression<bigint>;

type StringExpression =
    ValueExpression<string>
    | ConcatExpression<string>
    | FunctionExpression<string>
    | ColumnExpression<string>;

type DateExpression =
    ValueExpression<Date>
    | FunctionExpression<Date>
    | ColumnExpression<Date>;

type JsonExpression =
    ValueExpression<JsonValue>
    | ['j-', Expression<JsonValue>, Expression<string>]
    | ['j-a', Expression<JsonValue>, Expression<string>[] | undefined]
    | ConcatExpression<JsonValue>
    | FunctionExpression<JsonValue>
    | ColumnExpression<JsonValue>;

type ValueExpression<T extends ExpressionTypes> = ['val', T | undefined];
type NotExpression<T extends ExpressionTypes> = ['!', Expression<T>];
type PlusExpression<T extends ExpressionTypes> = ['+', Expression<T>[] | undefined];
type MinusExpression<T extends ExpressionTypes> = ['-', Expression<T>[] | undefined];
type MultiplyExpression<T extends ExpressionTypes> = ['*', Expression<T>[] | undefined];
type DivideExpression<T extends ExpressionTypes> = ['/', Expression<T>[] | undefined];
type PowerExpression<T extends ExpressionTypes> = ['**', Expression<T>[] | undefined];
type ConcatExpression<T extends ExpressionTypes> = ['||', Expression<T>[] | undefined];
type ColumnExpression<T extends ExpressionTypes> = ['col', string];
type FunctionExpression<T extends ExpressionTypes> = ['fun', string | undefined, Expression<any>[] | undefined, string | undefined];

type SwitchExpression<T extends ExpressionTypes> = ['swt', { cases?: ({ when: Expression<boolean>; then: Expression<T>; } | undefined)[]; otherwise?: Expression<T>; } | undefined];

type RawExpression<T> = ['raw', string];

// scope
type NotScope<T extends ExpressionTypes> = ['not', Expression<T>];
type AndScope<T extends ExpressionTypes> = ['and', Expression<T>[] | undefined];
type OrScope<T extends ExpressionTypes> = ['or', Expression<T>[] | undefined];

// operator
type Operators = IsOperators
    | EqualOperators
    | CompareOperators
    | ListOperators
    | BetweenOperators
    | LikeOperators
    | JsonOperators
    | undefined;

type IsOperators = ['is' | 'isn', Expression<null>];

type EqualOperators =
    EqualOperator<number>
    | EqualOperator<bigint>
    | EqualOperator<string>
    | EqualOperator<Date>;

type CompareOperators =
    CompareOperator<number>
    | CompareOperator<bigint>
    | CompareOperator<string>
    | CompareOperator<Date>;

type ListOperators =
    ListOperator<number>
    | ListOperator<bigint>
    | ListOperator<string>
    | ListOperator<Date>;

type BetweenOperators =
    BetweenOperator<number>
    | BetweenOperator<bigint>
    | BetweenOperator<string>
    | BetweenOperator<Date>;

type LikeOperators =
    ['lk', Expression<string>, Expression<string>]
    | ['lka' | 'lks', Expression<string>, Expression<string>[] | undefined];

type JsonOperators =
    ['@>', Expression<JsonValue>, Expression<JsonValue>]
    | ['<@', Expression<JsonValue>, Expression<JsonValue>]
    | ['?', Expression<JsonValue>, Expression<string>]
    | ['?|', Expression<JsonValue>, Expression<string>[] | undefined]
    | ['?&', Expression<JsonValue>, Expression<string>[] | undefined];

type EqualOperator<T extends ExpressionTypes> = ['=' | '!=', Expression<T>, Expression<T>];
type CompareOperator<T extends ExpressionTypes> = ['>' | '>=' | '<' | '<=', Expression<T>, Expression<T>];
type ListOperator<T extends ExpressionTypes> = ['in' | 'nin', Expression<T>, Expression<T>[] | undefined];
type BetweenOperator<T extends ExpressionTypes> = ['bt', Expression<T>, Expression<T>, Expression<T>];

export {ExpressionTypes};
export default Expression;
export {
    ValueExpression,
    NotExpression,
    PlusExpression,
    MinusExpression,
    MultiplyExpression,
    DivideExpression,
    PowerExpression,
    ConcatExpression,
    ColumnExpression,
    FunctionExpression,
    SwitchExpression,
    RawExpression
};
export {
    NotScope,
    AndScope,
    OrScope
};
export {
    IsOperators,
    LikeOperators,
    JsonOperators
};
export {
    EqualOperator,
    CompareOperator,
    ListOperator,
    BetweenOperator
};