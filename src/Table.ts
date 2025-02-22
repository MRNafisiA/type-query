import Decimal from 'decimal.js';

type Json = JsonObject | JsonArray;
type JsonObject = {
    [key: number | string]: BaseJsonValue;
};
type JsonArray = BaseJsonValue[];
type BaseJsonValue =
    | undefined
    | null
    | boolean
    | number
    | string
    | JsonObject
    | JsonArray;

type PgType =
    | 'boolean'
    // number
    | 'int2'
    | 'int4'
    | 'int8'
    | 'float4'
    | 'float8'
    | 'decimal'
    // string
    | 'char'
    | 'varchar'
    | 'text'
    | 'uuid'
    // date
    | 'date'
    // datetime
    | 'timestamp'
    | 'timestamptz'
    // json
    | 'json'
    | 'jsonb';

type NullableType<T, Nullable extends boolean> = Nullable extends true
    ? T | null
    : T;

type ReferenceActions =
    | 'no-action'
    | 'restrict'
    | 'set-null'
    | 'set-Default'
    | 'cascade';

type Schema = Record<
    string,
    {
        type: unknown;
        default: boolean;
        nullable: boolean;
    }
>;

type ColumnType<
    S extends Schema,
    key extends keyof S
> = S[key]['type'] extends number
    ? {
          type: 'int2' | 'int4' | 'float4' | 'float8';
          min?: number;
          max?: number;
      }
    : S[key]['type'] extends bigint
      ? {
            type: 'int8';
            min?: bigint;
            max?: bigint;
        }
      : S[key]['type'] extends Decimal
        ? {
              type: 'decimal';
              precision: number;
              scale: number;
              min?: Decimal;
              max?: Decimal;
          }
        : S[key]['type'] extends string
          ? {
                type: 'char' | 'varchar' | 'text' | 'uuid';
                minLength?: number;
                maxLength?: number;
                regex?: RegExp;
            }
          : S[key]['type'] extends Date
            ? {
                  type: 'date' |  'timestamp' | 'timestamptz';
                  length?: number;
              }
            : S[key]['type'] extends boolean
              ? {
                    type: 'boolean';
                }
              : {
                    type: 'json' | 'jsonb';
                };
type ColumnDefault<
    S extends Schema,
    key extends keyof S
> = S[key]['default'] extends true
    ? {
          default: true;
      } & (S[key]['type'] extends number
          ?
                | {
                      defaultValue: ['sql', string] | ['js', S[key]['type']];
                      sequenceTitle?: never;
                  }
                | {
                      defaultValue: ['auto-increment'];
                      sequenceTitle?: string;
                  }
          : S[key]['type'] extends bigint
            ?
                  | {
                        defaultValue: ['sql', string] | ['js', S[key]['type']];
                        sequenceTitle?: never;
                    }
                  | {
                        defaultValue: ['auto-increment'];
                        sequenceTitle?: string;
                    }
            : S[key]['type'] extends Date
              ? {
                    defaultValue:
                        | ['created-at']
                        | ['updated-at']
                        | ['sql', string]
                        | ['js', S[key]['type']];
                }
              : {
                    defaultValue: ['sql', string] | ['js', S[key]['type']];
                })
    : {
          default: false;
      };
type Table<S extends Schema = Schema> = {
    schemaName: string;
    tableName: string;
    columns: {
        [key in keyof S]: ColumnType<S, key> &
            ColumnDefault<S, key> & {
                nullable: S[key]['nullable'];
                title?: string;
                primary?: S[key]['nullable'] extends false ? true : never;
                reference?: {
                    table: Table;
                    onUpdate?: ReferenceActions;
                    onDelete?: ReferenceActions;
                    column: string;
                };
            };
    };
};

export type {
    Json,
    JsonObject,
    JsonArray,
    BaseJsonValue,
    PgType,
    NullableType,
    ReferenceActions,
    Schema,
    ColumnType,
    ColumnDefault,
    Table
};
