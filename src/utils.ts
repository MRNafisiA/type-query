import Decimal from 'decimal.js';
import {resolveColumn} from './entity';
import type Table from './types/table';
import type {JSON} from './types/json';
import type {ColumnTypeByTable, PostgresType} from './types/postgres';
import type {ExpressionTypes, ValueExpression, Expression, QueryExpression, Query} from './types/entity';
import type {
    ArithmeticOperator,
    NullOperator,
    BooleanOperator,
    CompareOperator,
    ListOperator,
    LikeOperator,
    JsonOperator
} from './types/context';

function val(v: null | undefined): ValueExpression<null>;
function val(v: boolean | undefined): ValueExpression<boolean>;
function val(v: number | undefined): ValueExpression<number>;
function val(v: bigint | undefined): ValueExpression<bigint>;
function val(v: Decimal | undefined): ValueExpression<Decimal>;
function val(v: string | undefined): ValueExpression<string>;
function val(v: Date | undefined): ValueExpression<Date>;
function val(v: JSON | undefined): ValueExpression<JSON>;
function val(v: any): any {
    return ['val', v];
}

function col<T extends Table, C extends keyof T['columns'] & string>(table: T, column: C, full?: boolean, alias?: string): ValueExpression<ColumnTypeByTable<T, C>>;
function col(table: any, column: any, full: boolean = false, alias?: any): any {
    return ['col', resolveColumn(table, column, full, alias)];
}

function fun<T extends ExpressionTypes>(name: string | undefined, args: Expression<any>[] | undefined, cast?: string): ValueExpression<T> ;
function fun(name: any, args: any, cast: any = ''): any {
    return ['fun', name, args, cast];
}

function swt<T extends ExpressionTypes>(cases: ({ when: Expression<boolean>, then: Expression<T> } | undefined)[] | undefined, otherwise?: Expression<T>): ValueExpression<T>;
function swt(cases: any, otherwise: any): any {
    return ['swt', cases, otherwise];
}

function raw<T extends ExpressionTypes>(v: string): ValueExpression<T> ;
function raw(v: any): any {
    return ['raw', v];
}

function subQry<T extends ExpressionTypes>(v: Query<any, any>): QueryExpression<T>;
function subQry(v: any): any {
    return ['qry', v];
}

function notOp(v: Expression<boolean>): ValueExpression<boolean> ;
function notOp(v: any): any {
    return ['not', v];
}

function artOp(v1: Expression<number>, op: ArithmeticOperator, v2: Expression<number>): ValueExpression<number>;
function artOp(v1: Expression<bigint>, op: ArithmeticOperator, v2: Expression<bigint>): ValueExpression<bigint>;
function artOp(v1: Expression<Decimal>, op: ArithmeticOperator, v2: Expression<Decimal>): ValueExpression<Decimal>;
function artOp(v1: any, op: ArithmeticOperator, v2: any): any {
    switch (op) {
        case '+':
            return ['+', [v1, v2]];
        case '-':
            return ['-', [v1, v2]];
        case '*':
            return ['*', [v1, v2]];
        case '/':
            return ['/', [v1, v2]];
        case '**':
            return ['**', [v1, v2]];
    }
}

function artAllOp(op: ArithmeticOperator, v: Expression<number>[] | undefined): ValueExpression<number>;
function artAllOp(op: ArithmeticOperator, v: Expression<bigint>[] | undefined): ValueExpression<bigint>;
function artAllOp(op: ArithmeticOperator, v: Expression<Decimal>[] | undefined): ValueExpression<Decimal>;
function artAllOp(op: ArithmeticOperator, v: any): any {
    switch (op) {
        case '+':
            return ['+', v];
        case '-':
            return ['-', v];
        case '*':
            return ['*', v];
        case '/':
            return ['/', v];
        case '**':
            return ['**', v];
    }
}

function conOp(v1: Expression<string>, v2: Expression<string>): ValueExpression<string>;
function conOp(v1: Expression<JSON>, v2: Expression<JSON>): ValueExpression<JSON>;
function conOp(v1: any, v2: any): any {
    return ['||', [v1, v2]];
}

function conAllOp(v: Expression<string>[] | undefined): ValueExpression<string>;
function conAllOp(v: Expression<JSON>[] | undefined): ValueExpression<JSON>;
function conAllOp(v: any): any {
    return ['||', v];
}

function jMinusOp(v1: Expression<JSON>, v2: Expression<string>): ValueExpression<JSON> ;
function jMinusOp(v1: any, v2: any): any {
    return ['j-', v1, v2];
}

function jArrMinusOp(v1: Expression<JSON>, v2: Expression<string>[] | undefined): ValueExpression<JSON> ;
function jArrMinusOp(v1: any, v2: any): any {
    return ['j-a', v1, v2];
}

function andOp(v1: Expression<boolean>, v2: Expression<boolean>): ValueExpression<boolean> ;
function andOp(v1: any, v2: any): any {
    return ['and', [v1, v2]];
}

function andAllOp(v: Expression<boolean>[] | undefined): ValueExpression<boolean> ;
function andAllOp(v: any): any {
    return ['and', v];
}

function orOp(v1: Expression<boolean>, v2: Expression<boolean>): ValueExpression<boolean> ;
function orOp(v1: any, v2: any): any {
    return ['or', [v1, v2]];
}

function orAllOp(v: Expression<boolean>[] | undefined): ValueExpression<boolean> ;
function orAllOp(v: any): any {
    return ['or', v];
}

function nullOp(v: Expression<null>, op: NullOperator): ValueExpression<boolean> ;
function nullOp(v: any, op: NullOperator): any {
    switch (op) {
        case '= null':
            return ['=n', v];
        case '!= null':
            return ['!=n', v];
    }
}

function boolOp(v: Expression<boolean>, op: BooleanOperator): ValueExpression<boolean> ;
function boolOp(v: any, op: BooleanOperator): any {
    switch (op) {
        case '= true':
            return ['=t', v];
        case '= false':
            return ['=f', v];
    }
}

function cmpOp(v1: Expression<number>, op: CompareOperator, v2: Expression<number>): ValueExpression<boolean> ;
function cmpOp(v1: Expression<bigint>, op: CompareOperator, v2: Expression<bigint>): ValueExpression<boolean> ;
function cmpOp(v1: Expression<Decimal>, op: CompareOperator, v2: Expression<Decimal>): ValueExpression<boolean> ;
function cmpOp(v1: Expression<string>, op: CompareOperator, v2: Expression<string>): ValueExpression<boolean> ;
function cmpOp(v1: Expression<Date>, op: CompareOperator, v2: Expression<Date>): ValueExpression<boolean> ;
function cmpOp(v1: any, op: CompareOperator, v2: any): any {
    switch (op) {
        case '=':
            return ['=', v1, v2];
        case '!=':
            return ['!=', v1, v2];
        case '>':
            return ['>', v1, v2];
        case '>=':
            return ['>=', v1, v2];
        case '<':
            return ['<', v1, v2];
        case '<=':
            return ['<=', v1, v2];
    }
}

function listOp(v1: Expression<number>, op: ListOperator, v2: Expression<number>[] | undefined): ValueExpression<boolean> ;
function listOp(v1: Expression<bigint>, op: ListOperator, v2: Expression<bigint>[] | undefined): ValueExpression<boolean> ;
function listOp(v1: Expression<Decimal>, op: ListOperator, v2: Expression<Decimal>[] | undefined): ValueExpression<boolean> ;
function listOp(v1: Expression<string>, op: ListOperator, v2: Expression<string>[] | undefined): ValueExpression<boolean> ;
function listOp(v1: Expression<Date>, op: ListOperator, v2: Expression<Date>[] | undefined): ValueExpression<boolean> ;
function listOp(v1: any, op: ListOperator, v2: any): any {
    switch (op) {
        case 'in':
            return ['in', v1, v2];
        case 'not in':
            return ['nin', v1, v2];
    }
}

function btOp(v1: Expression<number>, v2: Expression<number>, v3: Expression<number>): ValueExpression<boolean> ;
function btOp(v1: Expression<bigint>, v2: Expression<bigint>, v3: Expression<bigint>): ValueExpression<boolean> ;
function btOp(v1: Expression<Decimal>, v2: Expression<Decimal>, v3: Expression<Decimal>): ValueExpression<boolean> ;
function btOp(v1: Expression<string>, v2: Expression<string>, v3: Expression<string>): ValueExpression<boolean> ;
function btOp(v1: Expression<Date>, v2: Expression<Date>, v3: Expression<Date>): ValueExpression<boolean> ;
function btOp(v1: any, v2: any, v3: any): any {
    return ['bt', v1, v2, v3];
}

function likeOp(v1: Expression<string>, op: Extract<LikeOperator, 'like'>, v2: Expression<string>): ValueExpression<boolean> ;
function likeOp(v1: Expression<string>, op: Extract<LikeOperator, 'like all' | 'like some'>, v2: Expression<string>[] | undefined): ValueExpression<boolean> ;
function likeOp(v1: any, op: LikeOperator, v2: any): any {
    switch (op) {
        case 'like':
            return ['lk', v1, v2];
        case 'like all':
            return ['lka', v1, v2];
        case 'like some':
            return ['lks', v1, v2];
    }
}

function jsonOp(v1: Expression<JSON>, op: Extract<JsonOperator, '@>' | '<@'>, v2: Expression<JSON>): ValueExpression<boolean> ;
function jsonOp(v1: Expression<JSON>, op: Extract<JsonOperator, '?'>, v2: Expression<string>): ValueExpression<boolean> ;
function jsonOp(v1: Expression<JSON>, op: Extract<JsonOperator, '?&' | '?|'>, v2: Expression<string>[] | undefined): ValueExpression<boolean> ;
function jsonOp(v1: any, op: JsonOperator, v2: any): any {
    switch (op) {
        case '@>':
            return ['@>', v1, v2];
        case '<@':
            return ['<@', v1, v2];
        case '?':
            return ['?', v1, v2];
        case '?&':
            return ['?&', v1, v2];
        case '?|':
            return ['?|', v1, v2];
    }
}

function existsOp(v: QueryExpression<any>): ValueExpression<boolean>;
function existsOp(v: any): any {
    return ['exists', v];
}

const stringify = <T extends ExpressionTypes>(v: T, inline: boolean = false): T extends number ? number : T extends bigint ? bigint : string => {
    let result: number | bigint | string;
    if (v === null) {
        result = 'NULL';
    } else if (typeof v === 'boolean') {
        result = v ? 'TRUE' : 'FALSE';
    } else if (typeof v === 'number' || typeof v === 'bigint') {
        result = v;
    } else if (v instanceof Decimal) {
        result = inline ? `'${v.toString()}'` : v.toString();
    } else if (v instanceof Date) {
        result = inline ? `'${v.toISOString()}'` : v.toISOString();
    } else if (typeof v === 'object') {
        result = inline ? `'${JSON.stringify(v)}'::JSONB` : JSON.stringify(v);
    } else {
        result = inline ? `'${v}'` : v;
    }
    return result as any;
};

const cast = (v: unknown, [type, nullable]: [type: PostgresType, nullable: boolean]): ExpressionTypes => {
    if (nullable && v === null) {
        return null;
    }
    switch (type) {
        case 'bigint':
            return BigInt(v as string) as any;
        case 'numeric':
            return new Decimal(v as string) as any;
        default:
            return v as any;
    }
};

export {
    val,
    col,
    fun,
    swt,
    raw,
    subQry
};
export {
    notOp,
    artOp,
    artAllOp,
    conOp,
    conAllOp,
    jMinusOp,
    jArrMinusOp,
    andOp,
    andAllOp,
    orOp,
    orAllOp,
    nullOp,
    boolOp,
    cmpOp,
    listOp,
    btOp,
    likeOp,
    jsonOp,
    existsOp
};
export {
    stringify,
    cast
};