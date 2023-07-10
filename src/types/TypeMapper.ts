import { Table } from './Table';
import { PostgresType, PostgresTypeMapper } from './postgres';

type CustomTypeMap<Columns extends Table['columns']> = {
    [key in keyof Columns]?: PostgresTypeMapper<Columns[key]['type']>;
};

type TypeMapperWithoutCustomTypeMap<Type extends PostgresType, Nullable extends boolean> =
    | (true extends Nullable ? null : never)
    | PostgresTypeMapper<Type>;

type TypeMapperWithoutNull<
    Type extends PostgresType,
    CustomType extends PostgresTypeMapper<Type> | undefined
> = undefined extends CustomType ? PostgresTypeMapper<Type> : PostgresTypeMapper<Type> & CustomType;

type TypeMapper<
    Type extends PostgresType,
    Nullable extends boolean,
    CustomType extends PostgresTypeMapper<Type> | undefined
> = undefined extends CustomType
    ? TypeMapperWithoutCustomTypeMap<Type, Nullable>
    : TypeMapperWithoutCustomTypeMap<Type, Nullable> & CustomType;

type ColumnTypeWithoutCustomTypeWithoutNullByColumns<
    Columns extends Table['columns'],
    columnKey extends keyof Columns,
> = PostgresTypeMapper<Columns[columnKey]['type']>;
type ColumnTypeWithoutNullByColumns<
    Columns extends Table['columns'],
    columnKey extends keyof Columns,
    CTypeMap extends CustomTypeMap<Columns>
> = TypeMapperWithoutNull<Columns[columnKey]['type'], CTypeMap[columnKey]>;
type ColumnTypeByColumns<
    Columns extends Table['columns'],
    columnKey extends keyof Columns,
    CTypeMap extends CustomTypeMap<Columns>
> = TypeMapper<Columns[columnKey]['type'], Columns[columnKey]['nullable'], CTypeMap[columnKey]>;

type ColumnTypeByTable<
    T extends Table,
    columnKey extends keyof T['columns'],
    CTypeMap extends CustomTypeMap<T['columns']>
> = TypeMapper<T['columns'][columnKey]['type'], T['columns'][columnKey]['nullable'], CTypeMap[columnKey]>;

export type {
    CustomTypeMap,
    TypeMapperWithoutCustomTypeMap,
    TypeMapperWithoutNull,
    TypeMapper,
    ColumnTypeWithoutCustomTypeWithoutNullByColumns,
    ColumnTypeWithoutNullByColumns,
    ColumnTypeByColumns,
    ColumnTypeByTable
};
