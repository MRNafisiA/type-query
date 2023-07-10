import Decimal from 'decimal.js';
import type { Json } from './Json';

type OrderDirection = 'asc' | 'desc';

type PostgresType =
    | 'boolean'
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

type PostgresTypeMapper<Type extends PostgresType = PostgresType> = Type extends 'boolean'
    ? boolean
    : Type extends 'smallint' | 'integer' | 'real' | 'double precision'
    ? number
    : Type extends 'bigint'
    ? bigint
    : Type extends 'numeric'
    ? Decimal
    : Type extends 'character' | 'character varying' | 'text' | 'uuid'
    ? string
    : Type extends 'date' | 'timestamp without time zone' | 'timestamp with time zone'
    ? Date
    : Type extends 'json' | 'jsonb'
    ? Json
    : never;

export type { OrderDirection, PostgresType, PostgresTypeMapper };
