import Entity from './types/Entity';
import {PostgresType, PostgresTypeMapper} from './types/Postgres';
import Expression, {
    ColumnExpression,
    ExpressionTypes,
    FunctionExpression,
    RawExpression,
    SwitchExpression,
} from './types/Expression';
import {
    andScope,
    btOp,
    con,
    divide,
    eqOp,
    gEqOp,
    gOp,
    inOp,
    isNotNullOp,
    isNullOp,
    jAndOp,
    jArrMinus,
    jAtLOp,
    jAtROp,
    jIsOp,
    jMinus,
    jOrOp,
    lEqOp,
    lkaOp,
    lkOp,
    lksOp,
    lOp,
    minus,
    multi,
    not,
    notEqOp,
    notInOp,
    notScope,
    orScope,
    plus,
    pow,
    val
} from "./UtilsFunctions";

type GetNullableColumns<E extends Entity> = { [key in keyof E['columns'] as E['columns'][key]['nullable'] & E['columns'][key]['default'] extends never | true ? key & string : never]: E['columns'][key]; };

const TqUtilsBuilder = <E extends Entity>(entity: E) => ({
    ...TQ,
    col: <C extends keyof E['columns'] & string>(column: C, full: boolean = true) => TQ.col(column, entity, full),
    resolveCol: <C extends keyof E['columns'] & string>(column: C, full: boolean = true) => TQ.resolveCol(column, entity, full)
} as const);

const TQ = {
    val,
    not,
    plus,
    minus,
    multi,
    divide,
    pow,
    con,
    jMinus,
    jArrMinus,
    col: <E extends Entity, C extends keyof E['columns'] & string>(column: C, entity: E, full: boolean = true): ColumnExpression<PostgresTypeMapper<E['columns'][C]['type'], false, false>> =>
        ['col', TQ.resolveCol(column, entity, full)],
    fun: <Type extends ExpressionTypes>(name: string | undefined, args: Expression<any>[] | undefined, cast?: string): FunctionExpression<Type> => ['fun', name, args, cast],
    swt: <Type extends ExpressionTypes>(v: SwitchExpression<Type>[1] | undefined): SwitchExpression<Type> => ['swt', v],
    raw: <Type extends ExpressionTypes>(v: string): RawExpression<Type> => ['raw', v],
    // scope
    notScope,
    andScope,
    orScope,
    // operator
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
    jOrOp,
    // utils
    resolveCol: <E extends Entity, C extends keyof E['columns'] & string>(column: C, entity: E, full: boolean = true) =>
        full ? `"${entity.schema}"."${entity.title}"."${entity.columns[column].title ?? column}"` : `"${entity.columns[column].title ?? column}"`,
    stringify: (v: any, inline: boolean = false): number | bigint | string => {
        if (v === null) {
            return 'NULL';
        } else if (typeof v === 'boolean') {
            return v ? 'TRUE' : 'FALSE';
        } else if (typeof v === 'number' || typeof v === 'bigint') {
            return v;
        } else if (v instanceof Date) {
            return inline ? `'${v.toISOString()}'` : v.toISOString();
        } else if (typeof v === 'object') {
            return inline ? `'${JSON.stringify(v)}'::JSONB` : JSON.stringify(v);
        }
        return inline ? `'${v}'` : v;
    },
    parse: <T extends PostgresType, N extends boolean, D>(value: PostgresTypeMapper<T, N, D> extends bigint ? string : PostgresTypeMapper<T, N, D>, type: T): PostgresTypeMapper<T, N, D> => {
        switch (type) {
            case 'bigint':
                return BigInt(value as string) as any;
            default:
                return value as any;
        }
    }
} as const;

export {GetNullableColumns};
export {TQ, TqUtilsBuilder};