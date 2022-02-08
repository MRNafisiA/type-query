import {JsonArray, JsonObject, JsonValue} from './types/JSON';
import Expression, {
    AndScope,
    BetweenOperator,
    CompareOperator,
    ConcatExpression,
    DivideExpression,
    EqualOperator,
    IsOperators,
    JsonOperators,
    LikeOperators,
    ListOperator,
    MinusExpression,
    MultiplyExpression,
    NotExpression,
    NotScope,
    OrScope,
    PlusExpression,
    PowerExpression,
    ValueExpression
} from './types/Expression';

function val(v: null | undefined): ValueExpression<null>;
function val(v: boolean | undefined): ValueExpression<boolean>;
function val(v: number | undefined): ValueExpression<number>;
function val(v: bigint | undefined): ValueExpression<bigint>;
function val(v: string | undefined): ValueExpression<string>;
function val(v: Date | undefined): ValueExpression<Date>;
function val(v: JsonValue | undefined): ValueExpression<JsonValue>;
function val(v: any): any {
    return ['val', v];
}

function not(v: Expression<boolean>): NotExpression<boolean> {
    return ['!', v];
}

function plus(v: Expression<number>[] | undefined): PlusExpression<number>;
function plus(v: Expression<bigint>[] | undefined): PlusExpression<bigint>;
function plus(v: any): any {
    return ['+', v];
}

function minus(v: Expression<number>[] | undefined): MinusExpression<number>;
function minus(v: Expression<bigint>[] | undefined): MinusExpression<bigint>;
function minus(v: any): any {
    return ['-', v];
}

function multi(v: Expression<number>[] | undefined): MultiplyExpression<number>;
function multi(v: Expression<bigint>[] | undefined): MultiplyExpression<bigint>;
function multi(v: any): any {
    return ['*', v];
}

function divide(v: Expression<number>[] | undefined): DivideExpression<number>;
function divide(v: Expression<bigint>[] | undefined): DivideExpression<bigint>;
function divide(v: any): any {
    return ['/', v];
}

function pow(v: Expression<number>[] | undefined): PowerExpression<number>;
function pow(v: Expression<bigint>[] | undefined): PowerExpression<bigint>;
function pow(v: any): any {
    return ['**', v];
}

function con(v: Expression<string>[] | undefined): ConcatExpression<string>;
function con(v: Expression<JsonValue>[] | undefined): ConcatExpression<JsonValue>;
function con(v: Expression<JsonObject>[] | undefined): ConcatExpression<JsonObject>;
function con(v: Expression<JsonArray>[] | undefined): ConcatExpression<JsonArray>;
function con(v: any): any {
    return ['||', v];
}

function jMinus(v1: Expression<JsonValue>, v2: Expression<string>): ['j-', Expression<JsonValue>, Expression<string>] ;
function jMinus(v1: any, v2: any): any {
    return ['j-', v1, v2];
}

function jArrMinus(v1: Expression<JsonValue>, v2: Expression<string>[] | undefined): ['j-a', Expression<JsonValue>, Expression<string>[] | undefined] ;
function jArrMinus(v1: any, v2: any): any {
    return ['j-a', v1, v2];
}

// scope
function notScope(v: Expression<boolean>): NotScope<boolean> {
    return ['not', v];
}

function andScope(v: Expression<boolean>[] | undefined): AndScope<boolean> {
    return ['and', v];
}

function orScope(v: Expression<boolean>[] | undefined): OrScope<boolean> {
    return ['or', v];
}

// operator
function isNullOp(v: Expression<null>): IsOperators {
    return ['is', v];
}

function isNotNullOp(v: Expression<null>): IsOperators {
    return ['isn', v];
}

function eqOp(v1: Expression<number>, v2: Expression<number>): EqualOperator<number> ;
function eqOp(v1: Expression<bigint>, v2: Expression<bigint>): EqualOperator<bigint> ;
function eqOp(v1: Expression<string>, v2: Expression<string>): EqualOperator<string> ;
function eqOp(v1: Expression<Date>, v2: Expression<Date>): EqualOperator<Date> ;
function eqOp(v1: any, v2: any): any {
    return ['=', v1, v2];
}

function notEqOp(v1: Expression<number>, v2: Expression<number>): EqualOperator<number> ;
function notEqOp(v1: Expression<bigint>, v2: Expression<bigint>): EqualOperator<bigint> ;
function notEqOp(v1: Expression<string>, v2: Expression<string>): EqualOperator<string> ;
function notEqOp(v1: Expression<Date>, v2: Expression<Date>): EqualOperator<Date> ;
function notEqOp(v1: any, v2: any): any {
    return ['!=', v1, v2];
}

function gOp(v1: Expression<number>, v2: Expression<number>): CompareOperator<number> ;
function gOp(v1: Expression<bigint>, v2: Expression<bigint>): CompareOperator<bigint> ;
function gOp(v1: Expression<string>, v2: Expression<string>): CompareOperator<string> ;
function gOp(v1: Expression<Date>, v2: Expression<Date>): CompareOperator<Date> ;
function gOp(v1: any, v2: any): any {
    return ['>', v1, v2];
}

function gEqOp(v1: Expression<number>, v2: Expression<number>): CompareOperator<number> ;
function gEqOp(v1: Expression<bigint>, v2: Expression<bigint>): CompareOperator<bigint> ;
function gEqOp(v1: Expression<string>, v2: Expression<string>): CompareOperator<string> ;
function gEqOp(v1: Expression<Date>, v2: Expression<Date>): CompareOperator<Date> ;
function gEqOp(v1: any, v2: any): any {
    return ['>=', v1, v2];
}

function lOp(v1: Expression<number>, v2: Expression<number>): CompareOperator<number> ;
function lOp(v1: Expression<bigint>, v2: Expression<bigint>): CompareOperator<bigint> ;
function lOp(v1: Expression<string>, v2: Expression<string>): CompareOperator<string> ;
function lOp(v1: Expression<Date>, v2: Expression<Date>): CompareOperator<Date> ;
function lOp(v1: any, v2: any): any {
    return ['<', v1, v2];
}

function lEqOp(v1: Expression<number>, v2: Expression<number>): CompareOperator<number> ;
function lEqOp(v1: Expression<bigint>, v2: Expression<bigint>): CompareOperator<bigint> ;
function lEqOp(v1: Expression<string>, v2: Expression<string>): CompareOperator<string> ;
function lEqOp(v1: Expression<Date>, v2: Expression<Date>): CompareOperator<Date> ;
function lEqOp(v1: any, v2: any): any {
    return ['<=', v1, v2];
}

function inOp(v1: Expression<number>, v2: Expression<number>[] | undefined): ListOperator<number> ;
function inOp(v1: Expression<bigint>, v2: Expression<bigint>[] | undefined): ListOperator<bigint> ;
function inOp(v1: Expression<string>, v2: Expression<string>[] | undefined): ListOperator<string> ;
function inOp(v1: Expression<Date>, v2: Expression<Date>[] | undefined): ListOperator<Date> ;
function inOp(v1: any, v2: any): any {
    return ['in', v1, v2];
}

function notInOp(v1: Expression<number>, v2: Expression<number>[] | undefined): ListOperator<number> ;
function notInOp(v1: Expression<bigint>, v2: Expression<bigint>[] | undefined): ListOperator<bigint> ;
function notInOp(v1: Expression<string>, v2: Expression<string>[] | undefined): ListOperator<string> ;
function notInOp(v1: Expression<Date>, v2: Expression<Date>[] | undefined): ListOperator<Date> ;
function notInOp(v1: any, v2: any): any {
    return ['nin', v1, v2];
}

function btOp(v1: Expression<number>, v2: Expression<number>, v3: Expression<number>): BetweenOperator<number> ;
function btOp(v1: Expression<bigint>, v2: Expression<bigint>, v3: Expression<bigint>): BetweenOperator<bigint> ;
function btOp(v1: Expression<string>, v2: Expression<string>, v3: Expression<string>): BetweenOperator<string> ;
function btOp(v1: Expression<Date>, v2: Expression<Date>, v3: Expression<Date>): BetweenOperator<Date> ;
function btOp(v1: any, v2: any, v3: any): any {
    return ['bt', v1, v2, v3];
}

function lkOp(v1: Expression<string>, v2: Expression<string>): LikeOperators ;
function lkOp(v1: any, v2: any): any {
    return ['lk', v1, v2];
}

function lkaOp(v1: Expression<string>, v2: Expression<string>[] | undefined): LikeOperators ;
function lkaOp(v1: any, v2: any): any {
    return ['lka', v1, v2];
}

function lksOp(v1: Expression<string>, v2: Expression<string>[] | undefined): LikeOperators ;
function lksOp(v1: any, v2: any): any {
    return ['lks', v1, v2];
}

function jAtROp(v1: Expression<JsonValue>, v2: Expression<JsonValue>): JsonOperators ;
function jAtROp(v1: any, v2: any): any {
    return ['@>', v1, v2];
}

function jAtLOp(v1: Expression<JsonValue>, v2: Expression<JsonValue>): JsonOperators ;
function jAtLOp(v1: any, v2: any): any {
    return ['<@', v1, v2];
}

function jIsOp(v1: Expression<JsonValue>, v2: Expression<string>): JsonOperators ;
function jIsOp(v1: any, v2: any): any {
    return ['?', v1, v2];
}

function jAndOp(v1: Expression<JsonValue>, v2: Expression<string>[] | undefined): JsonOperators ;
function jAndOp(v1: any, v2: any): any {
    return ['?&', v1, v2];
}

function jOrOp(v1: Expression<JsonValue>, v2: Expression<string>[] | undefined): JsonOperators ;
function jOrOp(v1: any, v2: any): any {
    return ['?|', v1, v2];
}

export {
    val,
    not,
    plus,
    minus,
    multi,
    divide,
    pow,
    con,
    jMinus,
    jArrMinus
};
export {
    notScope,
    andScope,
    orScope
};
export {
    isNullOp,
    isNotNullOp,
    eqOp,
    notEqOp,
    gOp,
    gEqOp,
    lOp,
    lEqOp,
    inOp,
    notInOp,
    btOp,
    lkOp,
    lkaOp,
    lksOp,
    jAtROp,
    jAtLOp,
    jIsOp,
    jAndOp,
    jOrOp
};