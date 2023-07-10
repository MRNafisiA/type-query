import type { Table } from './Table';
import { ColumnTypeByColumns, CustomTypeMap } from './TypeMapper';

type SimpleModel<Columns extends Table['columns'], CTypeMap extends CustomTypeMap<Columns>={}> = {
    [col in keyof Columns]: ColumnTypeByColumns<Columns, col, CTypeMap>;
};

type Model<
    Columns extends Table['columns'],
    Requires extends readonly (keyof Columns)[],
    Optionals extends readonly (keyof Columns)[],
    CTypeMap extends CustomTypeMap<Columns>
> = {
    [key in Exclude<keyof Requires, keyof unknown[]> as Requires[key] & string]: ColumnTypeByColumns<
        Columns,
        Requires[key] & keyof Columns,
        CTypeMap
    >;
} & {
    [key in Exclude<keyof Optionals, keyof unknown[]> as Optionals[key] & string]?: ColumnTypeByColumns<
        Columns,
        Optionals[key] & keyof Columns,
        CTypeMap
    >;
};

export type { SimpleModel, Model };
