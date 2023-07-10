import Decimal from 'decimal.js';
import { Json } from './types/Json';
import { resolveColumn } from './entity';
import type { Table } from './types/Table';
import { Expression, Query } from './types/Entity';
import { ColumnTypeByTable, CustomTypeMap } from './types/TypeMapper';
import type {
    ArithmeticOperator,
    NullOperator,
    BooleanOperator,
    CompareOperator,
    ListOperator,
    LikeOperator,
    JsonOperator
} from './types/Context';

const val = <T extends Expression | undefined>(v: T): T => ['val', v] as any;

const col = <T extends Table, C extends keyof T['columns'] & string, CTypeMap extends CustomTypeMap<T['columns']>>(
    table: T,
    column: C,
    full?: boolean,
    alias?: string
): ColumnTypeByTable<T, C, CTypeMap> => ['col', resolveColumn(table, column, full, alias)] as any;

const fun = <T extends Expression>(name: string, args: readonly Expression[], cast = ''): T =>
    ['fun', name, args, cast] as any;

const funWithUndefined = <T extends Expression>(
    name: string,
    args: readonly (Expression | undefined)[],
    cast = ''
): T => ['fun', name, args, cast] as any;

const swt = <T extends Expression | undefined, W extends boolean | undefined>(
    cases: readonly { when: W; then: T }[],
    otherwise?: T
): T | (W & undefined) => ['swt', cases, otherwise] as any;

const raw = <T extends Expression | undefined>(v: string): T => ['raw', v] as any;

const subQry = <T extends Expression>(v: Query<any, any, any>): T => ['qry', v] as any;

const notOp = <T extends boolean | undefined>(v: T): T => ['not', v] as any;

const artOp = <T extends number | bigint | Decimal | undefined>(v1: T, op: ArithmeticOperator, v2: T): T =>
    [op, [v1, v2]] as any;

const artAllOp = <T extends number | bigint | Decimal | undefined>(op: ArithmeticOperator, v: T[]): T => [op, v] as any;

const conOp = <T extends string | Json | undefined>(v1: T, v2: T): T => ['||', [v1, v2]] as any;

const conAllOp = <T extends string | Json>(v: readonly T[]): T => ['||', v] as any;

const jMinusOp = <T extends Json | undefined, W extends string | undefined>(v1: T, v2: W): T | (W & undefined) =>
    ['j-', v1, v2] as any;

const jArrMinusOp = <T extends Json | undefined, W extends string | undefined>(v1: T, v2: W[]): T | (W & undefined) =>
    ['j-a', v1, v2] as any;

const andOp = <T extends boolean | undefined, W extends boolean | undefined>(v1: T, v2: W): T | (W & undefined) =>
    ['and', [v1, v2]] as any;

const andAllOp = <T extends boolean | undefined>(v: readonly T[]): T => ['and', v] as any;

const orOp = <T extends boolean | undefined, W extends boolean | undefined>(v1: T, v2: W): T | (W & undefined) =>
    ['or', [v1, v2]] as any;

const orAllOp = <T extends boolean | undefined>(v: readonly T[]): T => ['or', v] as any;

const nullOp = <T extends null | undefined>(v: T, op: NullOperator): boolean | (T & undefined) => {
    switch (op) {
        case '= null':
            return ['=n', v] as any;
        case '!= null':
            return ['!=n', v] as any;
    }
};

const boolOp = <T extends null | undefined>(v: T, op: BooleanOperator): T => {
    switch (op) {
        case '= true':
            return ['=t', v] as any;
        case '= false':
            return ['=f', v] as any;
    }
};

const cmpOp = <T extends number | bigint | Decimal | string | Date | undefined>(
    v1: T,
    op: CompareOperator,
    v2: T
): boolean | (T & undefined) => [op, v1, v2] as any;

const listOp = <T extends number | bigint | Decimal | string | Date | undefined>(
    v1: T,
    op: ListOperator,
    v2: T[]
): boolean | (T & undefined) =>
    [
        (
            {
                in: 'in',
                'not in': 'nin'
            } as const
        )[op],
        v1,
        v2
    ] as any;

const btOp = <T extends number | bigint | Decimal | string | Date | undefined>(
    v1: T,
    v2: T,
    v3: T
): boolean | (T & undefined) => ['bt', v1, v2, v3] as any;

function likeOp<T extends string | undefined>(
    v1: T,
    op: Extract<LikeOperator, 'like'>,
    v2: T
): boolean | (T & undefined);
function likeOp<T extends string | undefined>(
    v1: T,
    op: Extract<LikeOperator, 'like all' | 'like some'>,
    v2: readonly T[]
): boolean | (T & undefined);
function likeOp(v1: any, op: LikeOperator, v2: any): any {
    return [({ like: 'lk', 'like all': 'lka', 'like some': 'lks' } as const)[op], v1, v2];
}

function jsonOp<T extends Json | undefined>(
    v1: T,
    op: Extract<JsonOperator, '@>' | '<@'>,
    v2: T
): boolean | (T & undefined);
function jsonOp<T extends Json | undefined, W extends string | undefined>(
    v1: T,
    op: Extract<JsonOperator, '?'>,
    v2: W
): boolean | (T & undefined) | (W & undefined);
function jsonOp<T extends Json | undefined, W extends string | undefined>(
    v1: T,
    op: Extract<JsonOperator, '?&' | '?|'>,
    v2: readonly W[]
): boolean | (T & undefined) | (W & undefined);
function jsonOp(v1: any, op: JsonOperator, v2: any): any {
    return [op, v1, v2];
}

// function existsOp(v: QueryExpression<any>): ValueExpression<boolean>;
// function existsOp(v: any): any {
//     return ['exists', v];
// }

export { val, col, fun, funWithUndefined, swt, raw, subQry };
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
    jsonOp
};
