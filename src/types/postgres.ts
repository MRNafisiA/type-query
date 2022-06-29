import Decimal from 'decimal.js';
import type Table from './table';
import type {JSON} from './json';

type OrderDirection = 'asc' | 'desc';

type PostgresType = 'boolean'
    // number
    | 'smallint'
    | 'integer'
    | 'bigint'
    | 'real'
    | 'double precision'
    | 'numeric'
    // string
    | 'character'
    | 'character varying'
    | 'text'
    | 'uuid'
    // time
    | 'date'
    | 'timestamp without time zone'
    | 'timestamp with time zone'
    // json
    | 'json'
    | 'jsonb';

type PostgresTypeMapper<Type extends PostgresType, Nullable extends boolean> =
    Type extends 'boolean'
        ? (true extends Nullable ? null : never) | boolean
        : Type extends ('smallint' | 'integer' | 'real' | 'double precision')
            ? (true extends Nullable ? null : never) | number
            : Type extends 'bigint'
                ? (true extends Nullable ? null : never) | bigint
                : Type extends 'numeric'
                    ? (true extends Nullable ? null : never) | Decimal
                    : Type extends ('character' | 'character varying' | 'text' | 'uuid')
                        ? (true extends Nullable ? null : never) | string
                        : Type extends ('date' | 'timestamp without time zone' | 'timestamp with time zone')
                            ? (true extends Nullable ? null : never) | Date
                            : Type extends ('json' | 'jsonb')
                                ? (true extends Nullable ? null : never) | JSON
                                : never;

type ColumnTypeByColumns<Columns extends Table['columns'], columnKey extends keyof Columns> = PostgresTypeMapper<Columns[columnKey]['type'], Columns[columnKey]['nullable']>;
type ColumnTypeByTable<T extends Table, columnKey extends keyof T['columns']> = PostgresTypeMapper<T['columns'][columnKey]['type'], T['columns'][columnKey]['nullable']>;

export type {
    OrderDirection,
    PostgresType,
    PostgresTypeMapper,
    ColumnTypeByColumns,
    ColumnTypeByTable
};