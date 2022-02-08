import {JsonValue} from './JSON';

type Base = { title?: string; nullable: boolean; };

type Types = { type: 'boolean' | 'smallint' | 'integer' | 'bigint' | 'float' | 'double' | 'timestamp' | 'jsonb'; }
    | { type: 'varchar'; length?: number; };

type NoDefault = { default: false; };

type HasDefault = StaticDefault | DynamicDefault;

type StaticDefault = { default: true; } &
    ({ type: 'boolean'; value: boolean; }
        | { type: 'smallint' | 'integer' | 'float' | 'double'; value: number; }
        | { type: 'bigint'; value: bigint; }
        | { type: 'varchar'; value: string; }
        | { type: 'timestamp'; value: Date; }
        | { type: 'jsonb'; value: JsonValue; });

type DynamicDefault = { default: 'auto-increment'; type: 'smallint' | 'integer' | 'bigint'; } |
    { default: 'created-at' | 'updated-at'; type: 'timestamp'; };

type Entity = {
    code: number;
    schema: string;
    title: string;
    columns: { [key: string]: Base & Types & (NoDefault | HasDefault); };
};

export default Entity;