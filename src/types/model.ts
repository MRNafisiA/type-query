import type Table from './table';
import type {ColumnTypeByColumns, ColumnTypeByTable} from './postgres';

type SimpleModel<T extends Table> = { [col in keyof T['columns'] & string]: ColumnTypeByTable<T, col>; };

type Model<Columns extends Table['columns'], Requires extends readonly (keyof Columns)[], Optionals extends readonly (keyof Columns)[]> =
    {
        [key in Exclude<keyof Requires, keyof unknown[]> as Requires[key] & string]:
        ColumnTypeByColumns<Columns, Requires[key] & keyof Columns>;
    } &
    {
        [key in Exclude<keyof Optionals, keyof unknown[]> as Optionals[key] & string]?:
        ColumnTypeByColumns<Columns, Optionals[key] & keyof Columns>;
    };

export type {
    SimpleModel,
    Model
};