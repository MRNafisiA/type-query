import Decimal from 'decimal.js';
import * as Parser from './parser';
import { Table } from './types/Table';
import { err, ok, Result } from 'never-catch';
import { Model, SimpleModel } from './types/Model';
import { ColumnTypeByColumns, CustomTypeMap } from './types/TypeMapper';

const SmallIntRange = { min: -32768, max: 32767 };
const IntegerRange = { min: -2147483648, max: 2147483647 };
const BigIntRange = {
    min: BigInt('-9223372036854775808'),
    max: BigInt('9223372036854775807')
};

const validateNumberGenerator = ({
    min,
    max
}: {
    min?: number | bigint | undefined;
    max?: number | bigint | undefined;
}) => {
    if (min === undefined) {
        if (max === undefined) {
            return () => true;
        } else {
            return (v: number | bigint) => v <= max;
        }
    } else {
        if (max === undefined) {
            return (v: number | bigint) => min <= v;
        } else {
            return (v: number | bigint) => min <= v && v <= max;
        }
    }
};
const validateDecimalGenerator = ({ min, max }: { min?: Decimal | undefined; max?: Decimal | undefined }) => {
    if (min === undefined) {
        if (max === undefined) {
            return () => true;
        } else {
            return (v: Decimal) => v.comparedTo(max) <= 0;
        }
    } else {
        if (max === undefined) {
            return (v: Decimal) => 0 <= v.comparedTo(min);
        } else {
            return (v: Decimal) => 0 <= v.comparedTo(min) && v.comparedTo(max) <= 0;
        }
    }
};
const validateStringGenerator = ({
    regex,
    min,
    max
}: {
    regex?: RegExp | undefined;
    min?: number | undefined;
    max?: number | undefined;
}) => {
    if (regex === undefined) {
        if (min === undefined) {
            if (max === undefined) {
                return () => true;
            } else {
                return (v: string) => v.length <= max;
            }
        } else {
            if (max === undefined) {
                return (v: string) => min <= v.length;
            } else {
                return (v: string) => min <= v.length && v.length <= max;
            }
        }
    } else {
        if (min === undefined) {
            if (max === undefined) {
                return (v: string) => regex.test(v);
            } else {
                return (v: string) => regex.test(v) && v.length <= max;
            }
        } else {
            if (max === undefined) {
                return (v: string) => regex.test(v) && min <= v.length;
            } else {
                return (v: string) => regex.test(v) && min <= v.length && v.length <= max;
            }
        }
    }
};

type ModelUtils<Columns extends Table['columns'], CTypeMap extends CustomTypeMap<Columns>> = {
    Parse: <Requires extends readonly (keyof Columns)[], Optionals extends readonly (keyof Columns)[]>(
        data: { [key: string]: unknown },
        requires: Requires,
        optional: Optionals,
        validate?: boolean
    ) => Result<
        Model<Columns, Requires, Optionals, CTypeMap>,
        Requires[Exclude<keyof Requires, keyof unknown[]>] | Optionals[Exclude<keyof Optionals, keyof unknown[]>]
    >;
    Validate: <D extends Partial<SimpleModel<Columns, CTypeMap>>>(data: D) => Result<undefined, keyof D>;
} & {
    [key in keyof Columns]: {
        Parse: (v: unknown, validate?: boolean) => ColumnTypeByColumns<Columns, key, CTypeMap> | undefined;
        Validate: (v: ColumnTypeByColumns<Columns, key, CTypeMap>) => boolean;
    };
};
const createModelUtils = <Columns extends Table['columns'], CTypeMap extends CustomTypeMap<Columns>>(
    columns: Columns,
    custom?: {
        parse?: {
            [key in keyof Columns]?: (
                v: unknown | undefined
            ) => ColumnTypeByColumns<Columns, key, CTypeMap> | undefined;
        };
        validate?: { [key in keyof Columns]?: (v: ColumnTypeByColumns<Columns, key, CTypeMap>) => boolean };
    }
): ModelUtils<Columns, CTypeMap> => {
    const columnsParseAndValidate = Object.fromEntries(
        Object.entries(columns).map(([key, val]) => {
            let parseFun = custom?.parse?.[key];
            if (parseFun === undefined) {
                switch (val.type) {
                    case 'boolean':
                        parseFun = Parser.boolean as any;
                        break;
                    case 'smallint':
                    case 'integer':
                        parseFun = Parser.integer as any;
                        break;
                    case 'real':
                    case 'double precision':
                        parseFun = Parser.number as any;
                        break;
                    case 'bigint':
                        parseFun = Parser.bigInt as any;
                        break;
                    case 'numeric':
                        parseFun = Parser.decimal as any;
                        break;
                    case 'character':
                    case 'character varying':
                    case 'text':
                    case 'uuid':
                        parseFun = Parser.string as any;
                        break;
                    case 'date':
                    case 'timestamp without time zone':
                    case 'timestamp with time zone':
                        parseFun = Parser.date as any;
                        break;
                    case 'json':
                    case 'jsonb':
                        parseFun = Parser.json as any;
                        break;
                }
            }

            let validateFun = custom?.validate?.[key];
            if (validateFun === undefined) {
                switch (val.type) {
                    case 'smallint':
                        validateFun = validateNumberGenerator({
                            min: val.min ?? SmallIntRange.min,
                            max: val.max ?? SmallIntRange.max
                        }) as any;
                        break;
                    case 'integer':
                        validateFun = validateNumberGenerator({
                            min: val.min ?? IntegerRange.min,
                            max: val.max ?? IntegerRange.max
                        }) as any;
                        break;
                    case 'bigint':
                        validateFun = validateNumberGenerator({
                            min: val.min ?? BigIntRange.min,
                            max: val.max ?? BigIntRange.max
                        }) as any;
                        break;
                    case 'real':
                    case 'double precision':
                        if (val.min !== undefined || val.max !== undefined) {
                            validateFun = validateNumberGenerator({ min: val.min, max: val.max }) as any;
                        } else {
                            validateFun = () => true;
                        }
                        break;
                    case 'numeric':
                        if (val.min !== undefined || val.max !== undefined) {
                            validateFun = validateDecimalGenerator({ min: val.min, max: val.max }) as any;
                        } else {
                            validateFun = () => true;
                        }
                        break;
                    case 'character':
                    case 'character varying':
                        if (val.minLength !== undefined || val.maxLength !== undefined || val.regex !== undefined) {
                            validateFun = validateStringGenerator({
                                regex: val.regex,
                                min: val.minLength,
                                max: val.maxLength
                            }) as any;
                        } else {
                            validateFun = () => true;
                        }
                        break;
                    case 'boolean':
                    case 'text':
                    case 'uuid':
                    case 'date':
                    case 'timestamp without time zone':
                    case 'timestamp with time zone':
                    case 'json':
                    case 'jsonb':
                        validateFun = () => true;
                        break;
                }
            }

            const parseWithValidate = (v: string | undefined, validate: boolean = true) => {
                const parsedValue = parseFun!(v);
                if (validate && parsedValue !== undefined && !validateFun!(parsedValue)) {
                    return undefined;
                }
                return parsedValue;
            };
            return [key, { Parse: parseWithValidate, Validate: validateFun }];
        })
    );
    return {
        Parse: (data, requires, optionals, validate = true) => {
            const result = {} as { [key: string]: any };

            let require: any;
            for (require of requires) {
                if (data[require] === undefined) {
                    return err(require);
                }
                result[require] = columnsParseAndValidate[require].Parse!(data[require] as any);
                if (result[require] === undefined) {
                    return err(require);
                }
                if (validate && !columnsParseAndValidate[require].Validate!(result[require] as any)) {
                    return err(require);
                }
            }

            let optional: any;
            for (optional of optionals) {
                if (data[optional] === undefined) {
                    continue;
                }
                result[optional] = columnsParseAndValidate[optional].Parse!(data[optional] as any);
                if (result[optional] === undefined) {
                    return err(optional);
                }
                if (validate && !columnsParseAndValidate[optional].Validate!(result[optional] as any)) {
                    return err(optional);
                }
            }

            return ok(result as any);
        },
        Validate: data => {
            let dataKey: any;
            for (dataKey in data) {
                if (!columnsParseAndValidate[dataKey].Validate!(data[dataKey] as any)) {
                    return err(dataKey);
                }
            }
            return ok(undefined);
        },
        ...(columnsParseAndValidate as any)
    };
};

export { SmallIntRange, IntegerRange, BigIntRange };
export { validateNumberGenerator, validateDecimalGenerator, validateStringGenerator };
export { type ModelUtils, createModelUtils };
