import {JsonValue} from './JSON';

type OrderDirection = 'ASC' | 'DESC';

type PostgresType = 'boolean'
    | 'smallint'
    | 'integer'
    | 'bigint'
    | 'float'
    | 'double'
    | 'varchar'
    | 'timestamp'
    | 'jsonb';

type PostgresTypeMapper<Type extends PostgresType, Nullable extends boolean, Default> =
    Type extends 'boolean'
        ? Nullable & Default extends true ? boolean | null : boolean
        : Type extends ('smallint' | 'integer' | 'float' | 'double')
            ? Nullable & Default extends true ? number | null : number
            : Type extends 'bigint'
                ? Nullable & Default extends true ? bigint | null : bigint
                : Type extends 'varchar'
                    ? Nullable & Default extends true ? string | null : string
                    : Type extends 'timestamp'
                        ? Nullable & Default extends true ? Date | null : Date
                        : Type extends 'jsonb'
                            ? Nullable & Default extends true ? JsonValue | null : JsonValue
                            : never;

export {OrderDirection, PostgresType, PostgresTypeMapper};