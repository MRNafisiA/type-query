import Decimal from 'decimal.js';
import { err, ok, Result } from 'never-catch';
import { Json, Table, Schema, NullableType, TableBySchema } from './Table';

const Int2Range = {
    min: -32768,
    max: 32767
};
const Int4Range = {
    min: -2147483648,
    max: 2147483647
};
const Int8Range = {
    min: BigInt('-9223372036854775808'),
    max: BigInt('9223372036854775807')
};

const Parser = {
    boolean: <N extends boolean = false>(
        v: unknown,
        nullable = false as N
    ): NullableType<boolean, N> | undefined => {
        if (
            nullable &&
            (v === null ||
                (typeof v === 'string' && v.toLowerCase() === 'null'))
        ) {
            return null as NullableType<boolean, N>;
        }
        switch (typeof v) {
            case 'boolean':
                return v;
            case 'string':
                switch (v) {
                    case 't':
                    case 'true':
                        return true;
                    case 'f':
                    case 'false':
                        return false;
                    default:
                        return undefined;
                }
            default:
                return undefined;
        }
    },
    number: <N extends boolean = false>(
        v: unknown,
        nullable = false as N
    ): NullableType<number, N> | undefined => {
        if (
            nullable &&
            (v === null ||
                (typeof v === 'string' && v.toLowerCase() === 'null'))
        ) {
            return null as NullableType<number, N>;
        }
        if (typeof v === 'number') {
            return v;
        } else if (typeof v === 'string') {
            const _v = Number(v);
            return Number.isNaN(_v) ? undefined : _v;
        } else {
            return undefined;
        }
    },
    integer: <N extends boolean = false>(
        v: unknown,
        nullable = false as N
    ): NullableType<number, N> | undefined => {
        const _v = Parser.number(v, nullable);
        return typeof _v === 'number' ? Math.trunc(_v) : _v;
    },
    bigInt: <N extends boolean = false>(
        v: unknown,
        nullable = false as N
    ): NullableType<bigint, N> | undefined => {
        if (
            nullable &&
            (v === null ||
                (typeof v === 'string' && v.toLowerCase() === 'null'))
        ) {
            return null as NullableType<bigint, N>;
        }
        switch (typeof v) {
            case 'bigint':
                return v;
            case 'number':
                return BigInt(v);
            case 'string':
                try {
                    return BigInt(v);
                } catch (_) {
                    return undefined;
                }
            default:
                return undefined;
        }
    },
    decimal: <N extends boolean = false>(
        v: unknown,
        nullable = false as N
    ): NullableType<Decimal, N> | undefined => {
        if (
            nullable &&
            (v === null ||
                (typeof v === 'string' && v.toLowerCase() === 'null'))
        ) {
            return null as NullableType<Decimal, N>;
        }
        if (Decimal.isDecimal(v)) {
            return v;
        }
        switch (typeof v) {
            case 'number':
                return new Decimal(v);
            case 'string':
                try {
                    return new Decimal(v);
                } catch (_) {
                    return undefined;
                }
            default:
                return undefined;
        }
    },
    string: <N extends boolean = false>(
        v: unknown,
        nullable = false as N
    ): NullableType<string, N> | undefined => {
        if (
            nullable &&
            (v === null ||
                (typeof v === 'string' && v.toLowerCase() === 'null'))
        ) {
            return null as NullableType<string, N>;
        }
        switch (typeof v) {
            case 'boolean':
            case 'number':
            case 'bigint':
                return `${v}`;
            case 'string':
                return v;
            default:
                return undefined;
        }
    },
    dateTime: <N extends boolean = false>(
        v: unknown,
        nullable = false as N
    ): NullableType<Date, N> | undefined => {
        if (
            nullable &&
            (v === null ||
                (typeof v === 'string' && v.toLowerCase() === 'null'))
        ) {
            return null as NullableType<Date, N>;
        }
        if (v instanceof Date && `${v}` !== 'Invalid Date') {
            return v;
        }
        if (typeof v === 'number' || typeof v === 'string') {
            const _v = new Date(v);
            return `${_v}` === 'Invalid Date' ? undefined : _v;
        }
        return undefined;
    },
    date: <N extends boolean = false>(
        v: unknown,
        nullable = false as N
    ): NullableType<Date, N> | undefined => {
        const _v = Parser.dateTime(v, nullable);
        if (
            _v instanceof Date &&
            _v.toISOString().split('T')[1] !== '00:00:00.000Z'
        ) {
            return undefined;
        }
        return _v;
    },
    json: <N extends boolean = false>(
        v: unknown,
        nullable = false as N
    ): NullableType<Json, N> | undefined => {
        if (
            nullable &&
            (v === null ||
                (typeof v === 'string' && v.toLowerCase() === 'null'))
        ) {
            return null as NullableType<Json, N>;
        }
        const _v = typeof v !== 'string' ? JSON.stringify(v) : v;
        try {
            const parsedV = JSON.parse(_v);
            if (typeof parsedV !== 'object' || parsedV === null) {
                return undefined;
            }
            return parsedV;
        } catch (_) {
            return undefined;
        }
    }
};

type ModelHelper<S extends Schema, NotNull extends keyof S> = {
    [key in keyof S & string]: key extends NotNull
        ? S[key]['narrowType']
        : NullableType<S[key]['narrowType'], S[key]['nullable']>;
};

type Model<
    S extends Schema,
    Required extends keyof S & string,
    Optional extends keyof S & string,
    NotNull extends Required | Optional
> = Pick<ModelHelper<S, NotNull>, Required> &
    Partial<Pick<ModelHelper<S, NotNull>, Optional>>;

type ModelWithPrefix<
    S extends Schema,
    Required extends keyof S & string,
    Optional extends keyof S & string,
    NotNull extends Required | Optional,
    Prefix extends string
> = {
    [key in keyof Model<
        S,
        Required,
        Optional,
        NotNull
    > as `${Prefix}${key}`]: Model<S, Required, Optional, NotNull>[key];
};

type ModelParser<
    S extends Schema,
    EMap extends { [key in keyof S & string]: unknown }
> = {
    Parse: <
        Required extends keyof S & string,
        Optional extends keyof S & string,
        NotNull extends Required | Optional = never
    >(
        data: Record<string, unknown>,
        requires: Required[],
        optionals: Optional[],
        notNulls?: NotNull[]
    ) => Result<
        Model<S, Required, Optional, NotNull>,
        EMap[Required | Optional]
    >;
} & {
    [key in keyof S & string]: (
        v: unknown
    ) => NullableType<S[key]['narrowType'], S[key]['nullable']> | undefined;
};

const createModelParser = <
    S extends Schema,
    const EMap extends { [key in keyof S & string]: unknown } = {
        [key in keyof S & string]: key;
    }
>(
    { columns }: TableBySchema<S>,
    { parsers, errorsMap } = {} as {
        parsers?: {
            [key in keyof S & string]?: (
                v: NullableType<S[key]['narrowType'], S[key]['nullable']>
            ) =>
                | NullableType<S[key]['narrowType'], S[key]['nullable']>
                | undefined;
        };
        errorsMap?: EMap;
    }
): ModelParser<S, EMap> => {
    const columnsParser: Record<string, (v: unknown) => unknown> =
        Object.fromEntries(
            (
                Object.entries(columns) as [string, Table['columns'][string]][]
            ).map(([key, column]) => {
                let defaultParser;
                switch (column.type) {
                    case 'boolean':
                        defaultParser = Parser.boolean;
                        break;
                    case 'int2':
                        defaultParser = (v: unknown, nullable: boolean) => {
                            const _v = Parser.integer(v, nullable);
                            if (_v === null) {
                                return null;
                            }
                            if (
                                _v !== undefined &&
                                (column.min ?? Int2Range.min) <= _v &&
                                (column.max ?? Int2Range.max) >= _v
                            ) {
                                return _v;
                            }
                            return undefined;
                        };
                        break;
                    case 'int4':
                        defaultParser = (v: unknown, nullable: boolean) => {
                            const _v = Parser.integer(v, nullable);
                            if (_v === null) {
                                return null;
                            }
                            if (
                                _v !== undefined &&
                                (column.min ?? Int4Range.min) <= _v &&
                                (column.max ?? Int4Range.max) >= _v
                            ) {
                                return _v;
                            }
                            return undefined;
                        };
                        break;
                    case 'int8':
                        defaultParser = (v: unknown, nullable: boolean) => {
                            const _v = Parser.bigInt(v, nullable);
                            if (_v === null) {
                                return null;
                            }
                            if (
                                _v !== undefined &&
                                (column.min ?? Int8Range.min) <= _v &&
                                (column.max ?? Int8Range.max) >= _v
                            ) {
                                return _v;
                            }
                            return undefined;
                        };
                        break;
                    case 'float4':
                    case 'float8':
                        defaultParser = (v: unknown, nullable: boolean) => {
                            const _v = Parser.number(v, nullable);
                            if (_v === null) {
                                return null;
                            }
                            if (
                                _v !== undefined &&
                                (column.min === undefined ||
                                    column.min <= _v) &&
                                (column.max === undefined || column.max >= _v)
                            ) {
                                return _v;
                            }
                            return undefined;
                        };
                        break;
                    case 'decimal':
                        defaultParser = (v: unknown, nullable: boolean) => {
                            const _v = Parser.decimal(v, nullable);
                            if (_v === null) {
                                return null;
                            }
                            if (
                                _v !== undefined &&
                                (column.min === undefined ||
                                    _v.comparedTo(column.min) >= 0) &&
                                (column.max === undefined ||
                                    _v.comparedTo(column.max) <= 0) &&
                                _v.decimalPlaces() <= column.scale &&
                                _v.precision() - _v.decimalPlaces() <=
                                    column.precision
                            ) {
                                return _v;
                            }
                            return undefined;
                        };
                        break;
                    case 'char':
                    case 'varchar':
                    case 'text':
                    case 'uuid':
                        defaultParser = (v: unknown, nullable: boolean) => {
                            const _v = Parser.string(v, nullable);
                            if (_v === null) {
                                return null;
                            }
                            if (
                                _v !== undefined &&
                                (column.minLength === undefined ||
                                    column.minLength <= _v.length) &&
                                (column.maxLength === undefined ||
                                    column.maxLength >= _v.length) &&
                                (column.regex === undefined ||
                                    column.regex.test(_v))
                            ) {
                                return _v;
                            }
                            return undefined;
                        };
                        break;
                    case 'date':
                        defaultParser = Parser.date;
                        break;
                    case 'timestamp':
                    case 'timestamptz':
                        defaultParser = Parser.dateTime;
                        break;
                    case 'json':
                    case 'jsonb':
                        defaultParser = Parser.json;
                        break;
                    default:
                        defaultParser = (v: unknown) => v;
                }

                const customParser = parsers?.[key];
                return [
                    key,
                    customParser !== undefined
                        ? (v: unknown) => {
                              const _v = defaultParser(
                                  v,
                                  columns[key].nullable
                              );
                              if (_v === undefined) {
                                  return undefined;
                              }
                              return customParser(_v);
                          }
                        : (v: unknown) =>
                              defaultParser(v, columns[key].nullable)
                ];
            })
        );

    return {
        Parse: (data, requires, optionals, notNulls = []) => {
            const result = {} as Record<string, unknown>;

            for (const key of requires) {
                if (data[key] === undefined) {
                    return err(errorsMap?.[key] ?? key);
                }
                result[key] = columnsParser[key](data[key]);
                if (
                    result[key] === undefined ||
                    (result[key] === null &&
                        notNulls.includes(key as (typeof notNulls)[number]))
                ) {
                    return err(errorsMap?.[key] ?? key);
                }
            }
            for (const key of optionals) {
                if (data[key] === undefined) {
                    continue;
                }
                result[key] = columnsParser[key](data[key]);
                if (
                    result[key] === undefined ||
                    (result[key] === null &&
                        notNulls.includes(key as (typeof notNulls)[number]))
                ) {
                    return err(errorsMap?.[key] ?? key);
                }
            }

            return ok(result);
        },
        ...columnsParser
    } as ModelParser<S, EMap>;
};

export type { ModelHelper, Model, ModelWithPrefix, ModelParser };
export { Int2Range, Int4Range, Int8Range, Parser, createModelParser };
