import * as U from './utils';
import { err, ok, Result } from 'never-catch';
import { NullableType, PgType, Schema, Table } from './Table';

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

type Model<
    S extends Schema,
    R extends readonly (keyof S)[],
    O extends readonly (keyof S)[]
> = {
    [key in Exclude<keyof R, keyof never[]> as R[key] & string]: NullableType<
        S[R[key] & string]['type'],
        S[R[key] & string]['nullable']
    >;
} & {
    [key in Exclude<keyof O, keyof never[]> as O[key] & string]?: NullableType<
        S[O[key] & string]['type'],
        S[O[key] & string]['nullable']
    >;
};

type ModelParser<
    S extends Schema,
    EMap extends { [key in keyof S]: unknown }
> = {
    Parse: <
        R extends readonly (keyof S & string)[],
        O extends readonly (keyof S & string)[]
    >(
        data: Record<string, unknown>,
        requires: R,
        optionals: O
    ) => Result<
        Model<S, R, O>,
        EMap[(
            | R[Exclude<keyof R, keyof never[]>]
            | O[Exclude<keyof O, keyof never[]>]
        ) &
            keyof EMap]
    >;
} & {
    [key in keyof S]: (
        v: unknown
    ) => NullableType<S[key]['type'], S[key]['nullable']> | undefined;
};

const createModelParser = <
    S extends Schema,
    EMap extends { [key in keyof S]: unknown } = {
        [key in keyof S]: key;
    }
>(
    { columns }: Table<S>,
    { parsers, errorsMap } = {} as {
        parsers?: {
            [key in keyof S]?: (
                v: NullableType<S[key]['type'], S[key]['nullable']>
            ) => NullableType<S[key]['type'], S[key]['nullable']> | undefined;
        };
        errorsMap?: EMap;
    }
): ModelParser<S, EMap> => {
    const columnsParser: Record<string, (v: unknown) => unknown> =
        Object.fromEntries(
            Object.entries(columns).map(([key, column]) => {
                let defaultParser;
                switch (column.type as PgType) {
                    case 'boolean':
                        defaultParser = U.Cast.boolean;
                        break;
                    case 'int2':
                        defaultParser = (v: unknown, nullable: boolean) => {
                            const _v = U.Cast.integer(v, nullable);
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
                            const _v = U.Cast.integer(v, nullable);
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
                            const _v = U.Cast.bigInt(v, nullable);
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
                            const _v = U.Cast.number(v, nullable);
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
                            const _v = U.Cast.decimal(v, nullable);
                            if (_v === null) {
                                return null;
                            }
                            if (
                                _v !== undefined &&
                                (column.min === undefined ||
                                    _v.comparedTo(column.min) >= 0) &&
                                (column.max === undefined ||
                                    _v.comparedTo(column.max) <= 0)
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
                            const _v = U.Cast.string(v, nullable);
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
                    case 'timestamp':
                    case 'timestamptz':
                        defaultParser = U.Cast.date;
                        break;
                    case 'json':
                    case 'jsonb':
                        defaultParser = U.Cast.json;
                        break;
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
        Parse: (data, requires, optionals) => {
            const result = {} as Record<string, unknown>;

            for (const key of requires) {
                if (data[key] === undefined) {
                    return err(errorsMap?.[key] ?? key);
                }
                result[key] = columnsParser[key](data[key]);
                if (result[key] === undefined) {
                    return err(errorsMap?.[key] ?? key);
                }
            }
            for (const key of optionals) {
                if (data[key] === undefined) {
                    continue;
                }
                result[key] = columnsParser[key](data[key]);
                if (result[key] === undefined) {
                    return err(errorsMap?.[key] ?? key);
                }
            }

            return ok(result);
        },
        ...columnsParser
    } as ModelParser<S, EMap>;
};

export type { Model, ModelParser };
export { Int2Range, Int4Range, Int8Range, createModelParser };
