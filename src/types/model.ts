import type Table from './table';
import type {ColumnTypeByColumns} from './postgres';
import {Result} from "never-catch";

type SimpleModel<Columns extends Table['columns']> = { [col in keyof Columns & string]: ColumnTypeByColumns<Columns, col>; };

type Model<Columns extends Table['columns'], Requires extends readonly (keyof Columns)[], Optionals extends readonly (keyof Columns)[]> =
    {
        [key in Exclude<keyof Requires, keyof unknown[]> as Requires[key] & string]:
        ColumnTypeByColumns<Columns, Requires[key] & keyof Columns>;
    } &
    {
        [key in Exclude<keyof Optionals, keyof unknown[]> as Optionals[key] & string]?:
        ColumnTypeByColumns<Columns, Optionals[key] & keyof Columns>;
    };

type ModelUtils<Columns extends Table['columns']> = {
    Parse: <Requires extends readonly (keyof Columns)[], Optionals extends readonly (keyof Columns)[]>(
        data: { [key: string]: string | undefined },
        requires: Requires,
        optional: Optionals,
        validate?: boolean
    ) => Result<Model<Columns, Requires, Optionals>, Requires[Exclude<keyof Requires, keyof unknown[]>] | Optionals[Exclude<keyof Optionals, keyof unknown[]>]>;
    Validate: <D extends Partial<SimpleModel<Columns>>>(
        data: D,
    ) => Result<undefined, keyof D>;
} & {
    [key in keyof Columns]: {
        Parse: (v: string | undefined, validate?: boolean) => ColumnTypeByColumns<Columns, key> | undefined;
        Validate: (v: ColumnTypeByColumns<Columns, key>) => boolean;
    }
};

export type {
    SimpleModel,
    Model,
    ModelUtils
};