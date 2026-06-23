import Decimal from 'decimal.js';

const createReference = <T extends Table, C extends keyof T['columns']>(
    reference: Reference<T, C>
) => reference as GetColumnType<T['columns'][C]>;

type Schema = Record<
    string,
    | {
          type: Exclude<PgType, 'decimal'>;
          default: boolean;
          nullable: boolean;
          narrowType: unknown;
      }
    | {
          type: 'decimal';
          default: boolean;
          nullable: boolean;
          narrowType: unknown;
          precision: number;
          scale: number;
      }
>;

type SchemaByColumns<C extends Columns> = {
    [key in keyof C & string]: {
        type: C[key]['type'];
        default: C[key]['default'];
        nullable: C[key]['nullable'];
        narrowType: GetColumnType<C[key]>;
    };
};

type TableBySchema<S extends Schema = Schema> = {
    schemaName: string;
    tableName: string;
    columns: S;
};

const createTable = <C extends Columns>(table: Table<C>) =>
    table as Table<{
        [key in keyof C & string]: C[key] & {
            narrowType: GetColumnType<C[key]>;
        };
    }>;

type Table<C extends Columns = Columns> = {
    schemaName: string;
    tableName: string;
    columns: C;
};

type Columns = Record<string, ColumnInfo>;

type ColumnInfo =
    | BooleanColumn
    | Int2Int4Column
    | Int8Column
    | Float4Float8Column
    | DecimalColumn
    | CharVarcharTextUuidColumn
    | DateTimestampTimestamptzColumn
    | JsonJsonbColumn
    | CustomTypeColumn;

type Reference<T extends Table, C extends keyof T['columns']> = {
    table: T;
    onUpdate?: ReferenceActions;
    onDelete?: ReferenceActions;
    column: C;
};

type GetColumnType<CI extends ColumnInfo> =
    CI extends BooleanColumn<infer U>
        ? U
        : CI extends Int2Int4Column<infer U>
          ? U
          : CI extends Int8Column<infer U>
            ? U
            : CI extends Float4Float8Column<infer U>
              ? U
              : CI extends DecimalColumn<infer U>
                ? U
                : CI extends CharVarcharTextUuidColumn<infer U>
                  ? U
                  : CI extends DateTimestampTimestamptzColumn<infer U>
                    ? U
                    : CI extends JsonJsonbColumn<infer U>
                      ? U
                      : CI extends CustomTypeColumn<infer U>
                        ? U
                        : never;

type CommonColumnInfo = { title?: string } & (
    | { nullable: false; primary?: true | never }
    | { nullable: true; primary?: never }
);

type BooleanColumn<NT extends boolean = boolean> = {
    type: 'boolean';
    narrowType?: NT;
    reference?: NT;
} & (
    | { default: false }
    | {
          default: true;
          defaultValue: ['sql', string] | ['js', boolean];
      }
) &
    CommonColumnInfo;

type Int2Int4Column<NT extends number = number> = {
    type: 'int2' | 'int4';
    narrowType?: NT;
    reference?: NT;
    min?: number;
    max?: number;
} & (
    | { default: false }
    | {
          default: true;
          defaultValue: ['sql', string] | ['js', number];
          sequenceTitle?: never;
      }
    | {
          default: true;
          defaultValue: ['auto-increment'];
          sequenceTitle?: string;
      }
) &
    CommonColumnInfo;

type Int8Column<NT extends bigint = bigint> = {
    type: 'int8';
    narrowType?: NT;
    reference?: NT;
    min?: bigint;
    max?: bigint;
} & (
    | { default: false }
    | {
          default: true;
          defaultValue: ['sql', string] | ['js', bigint];
          sequenceTitle?: never;
      }
    | {
          default: true;
          defaultValue: ['auto-increment'];
          sequenceTitle?: string;
      }
) &
    CommonColumnInfo;

type Float4Float8Column<NT extends number = number> = {
    type: 'float4' | 'float8';
    narrowType?: NT;
    reference?: NT;
    min?: number;
    max?: number;
} & (
    | { default: false }
    | {
          default: true;
          defaultValue: ['sql', string] | ['js', number];
      }
) &
    CommonColumnInfo;

type DecimalColumn<NT extends Decimal = Decimal> = {
    type: 'decimal';
    narrowType?: NT;
    reference?: NT;
    precision: number;
    scale: number;
    min?: Decimal;
    max?: Decimal;
} & (
    | { default: false }
    | {
          default: true;
          defaultValue: ['sql', string] | ['js', Decimal];
      }
) &
    CommonColumnInfo;

type CharVarcharTextUuidColumn<NT extends string = string> = {
    type: 'char' | 'varchar' | 'text' | 'uuid';
    narrowType?: NT;
    reference?: NT;
    minLength?: number;
    maxLength?: number;
    regex?: RegExp;
} & (
    | { default: false }
    | {
          default: true;
          defaultValue: ['sql', string] | ['js', string];
      }
) &
    CommonColumnInfo;

type DateTimestampTimestamptzColumn<NT extends Date = Date> = {
    type: 'date' | 'timestamp' | 'timestamptz';
    narrowType?: NT;
    reference?: NT;
    length?: number;
} & (
    | { default: false }
    | {
          default: true;
          defaultValue:
              | ['sql', string]
              | ['js', Date]
              | ['created-at']
              | ['updated-at'];
      }
) &
    CommonColumnInfo;

type JsonJsonbColumn<NT extends Json = Json> = {
    type: 'json' | 'jsonb';
    reference?: NT;
    narrowType?: NT;
} & (
    | { default: false }
    | {
          default: true;
          defaultValue: ['sql', string] | ['js', Json];
      }
) &
    CommonColumnInfo;

type CustomTypeColumn<NT = unknown> = {
    type: `custom(${string})`;
    reference?: NT;
    narrowType: NT;
} & (
    | { default: false }
    | {
          default: true;
          defaultValue: ['sql', string] | ['js', NT];
      }
) &
    CommonColumnInfo;

type ReferenceActions =
    | 'no-action'
    | 'restrict'
    | 'set-null'
    | 'set-Default'
    | 'cascade';

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
    | 'jsonb'
    // custom
    | `custom(${string})`;

type NullableType<T, Nullable extends boolean> = Nullable extends true
    ? T | null
    : T;

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

export { createReference, createTable };
export type {
    Schema,
    SchemaByColumns,
    TableBySchema,
    Table,
    Columns,
    ColumnInfo,
    Reference,
    GetColumnType,
    BooleanColumn,
    Int2Int4Column,
    Int8Column,
    Float4Float8Column,
    DecimalColumn,
    CharVarcharTextUuidColumn,
    DateTimestampTimestamptzColumn,
    JsonJsonbColumn,
    CustomTypeColumn,
    ReferenceActions,
    PgType,
    NullableType,
    Json,
    JsonObject,
    JsonArray,
    BaseJsonValue
};
