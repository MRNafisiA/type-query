import Decimal from 'decimal.js';
import type {JSON} from './json';
import {PostgresType} from './postgres';

type ReferenceActions = 'no-action' | 'restrict' | 'set-null' | 'set-Default' | 'cascade';

type Base = {
    type: PostgresType;
    default: boolean | 'value' | 'auto-increment' | 'created-at' | 'updated-at';
    nullable: boolean;
    title?: string;
    reference?: { table: Table, onUpdate?: ReferenceActions, onDelete?: ReferenceActions, column: string };
};

type Primary = { primary?: true, nullable: false } | { nullable: true };

type Types =
    {
        type: 'boolean'
            | 'smallint' | 'integer' | 'bigint' | 'real' | 'double precision'
            | 'text' | 'uuid'
            | 'date'
            | 'json' | 'jsonb'
    }
    | { type: 'numeric', precision: number, scale: number }
    | { type: 'character' | 'character varying', length?: number }
    | { type: 'time without time zone' | 'time with time zone' | 'timestamp without time zone' | 'timestamp with time zone', length?: number };

type ReferenceCheck<T extends Table, C extends keyof T['columns']> =
    { type: 'boolean', reference?: { table: T, onUpdate?: ReferenceActions, onDelete?: ReferenceActions, column: T['columns'][C]['type'] extends 'boolean' ? C : never } }
    | { type: 'smallint', reference?: { table: T, onUpdate?: ReferenceActions, onDelete?: ReferenceActions, column: T['columns'][C]['type'] extends 'smallint' ? C : never } }
    | { type: 'integer', reference?: { table: T, onUpdate?: ReferenceActions, onDelete?: ReferenceActions, column: T['columns'][C]['type'] extends 'smallint' | 'integer' ? C : never } }
    | { type: 'bigint', reference?: { table: T, onUpdate?: ReferenceActions, onDelete?: ReferenceActions, column: T['columns'][C]['type'] extends 'smallint' | 'integer' | 'bigint' ? C : never } }
    | { type: 'real', reference?: { table: T, onUpdate?: ReferenceActions, onDelete?: ReferenceActions, column: T['columns'][C]['type'] extends 'real' ? C : never } }
    | { type: 'double precision', reference?: { table: T, onUpdate?: ReferenceActions, onDelete?: ReferenceActions, column: T['columns'][C]['type'] extends 'double precision' ? C : never } }
    | { type: 'text', reference?: { table: T, onUpdate?: ReferenceActions, onDelete?: ReferenceActions, column: T['columns'][C]['type'] extends 'text' ? C : never } }
    | { type: 'uuid', reference?: { table: T, onUpdate?: ReferenceActions, onDelete?: ReferenceActions, column: T['columns'][C]['type'] extends 'uuid' ? C : never } }
    | { type: 'date', reference?: { table: T, onUpdate?: ReferenceActions, onDelete?: ReferenceActions, column: T['columns'][C]['type'] extends 'date' ? C : never } }
    | { type: 'json', reference?: { table: T, onUpdate?: ReferenceActions, onDelete?: ReferenceActions, column: T['columns'][C]['type'] extends 'json' ? C : never } }
    | { type: 'jsonb', reference?: { table: T, onUpdate?: ReferenceActions, onDelete?: ReferenceActions, column: T['columns'][C]['type'] extends 'jsonb' ? C : never } }
    | { type: 'numeric', reference?: { table: T, onUpdate?: ReferenceActions, onDelete?: ReferenceActions, column: T['columns'][C]['type'] extends 'numeric' ? C : never } }
    | { type: 'character', reference?: { table: T, onUpdate?: ReferenceActions, onDelete?: ReferenceActions, column: T['columns'][C]['type'] extends 'character' ? C : never } }
    | { type: 'character varying', reference?: { table: T, onUpdate?: ReferenceActions, onDelete?: ReferenceActions, column: T['columns'][C]['type'] extends 'character varying' ? C : never } }
    | { type: 'time without time zone', reference?: { table: T, onUpdate?: ReferenceActions, onDelete?: ReferenceActions, column: T['columns'][C]['type'] extends 'time without time zone' ? C : never } }
    | { type: 'time with time zone', reference?: { table: T, onUpdate?: ReferenceActions, onDelete?: ReferenceActions, column: T['columns'][C]['type'] extends 'time with time zone' ? C : never } }
    | { type: 'timestamp without time zone', reference?: { table: T, onUpdate?: ReferenceActions, onDelete?: ReferenceActions, column: T['columns'][C]['type'] extends 'timestamp without time zone' ? C : never } }
    | { type: 'timestamp with time zone', reference?: { table: T, onUpdate?: ReferenceActions, onDelete?: ReferenceActions, column: T['columns'][C]['type'] extends 'timestamp with time zone' ? C : never } };

type Default = { default: false; }
    | { default: true; value: string; }
    | { default: 'auto-increment', type: 'smallint' | 'integer' | 'bigint', seqTitle?: string }
    | { default: 'created-at' | 'updated-at', type: 'time without time zone' | 'time with time zone' | 'timestamp without time zone' | 'timestamp with time zone' }
    | (
    { default: 'value', type: 'boolean', value: boolean }
    | { default: 'value', type: 'smallint' | 'integer' | 'real' | 'double precision', value: number }
    | { default: 'value', type: 'bigint', value: bigint }
    | { default: 'value', type: 'numeric', value: Decimal }
    | { default: 'value', type: 'character' | 'character varying' | 'text' | 'uuid', value: string }
    | { default: 'value', type: 'time without time zone' | 'time with time zone' | 'date' | 'timestamp without time zone' | 'timestamp with time zone', value: Date }
    | { default: 'value', type: 'json' | 'jsonb', value: JSON }
    );

type Column = Base & Primary & Types & Default;
type Table = {
    schema: string;
    title: string;
    columns: { [key: string]: Column };
};
type TableCheck = {
    schema: string;
    title: string;
    columns: { [key: string]: Base & Primary & Types & Default & ReferenceCheck<Table, keyof Table['columns']> };
};

export default Table;
export type {ReferenceActions, Column, TableCheck};