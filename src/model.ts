import Decimal from 'decimal.js';
import Table from './types/table';
import {err, ok} from 'never-catch';
import {ModelUtils} from './types/model';
import {ColumnTypeByColumns} from './types/postgres';

const parseBoolean = (v: string): boolean | undefined => v === 'true' ? true : v === 'false' ? false : undefined;
const parseNumber = (v: string): number | undefined => {
    const _v = Number(v);
    return Number.isNaN(_v) ? undefined : _v;
};
const parseBigInt = (v: string): bigint | undefined => {
    try {
        return BigInt(v);
    } catch (_) {
        return undefined;
    }
};
const parseDecimal = (v: string): Decimal | undefined => {
    try {
        return new Decimal(v);
    } catch (_) {
        return undefined;
    }
};
const parseString = (v: string): string | undefined => v;
const parseDate = (v: string): Date | undefined => {
    const _v = new Date(v);
    return _v.toString() === 'Invalid Date' ? undefined : _v;
};
const parseJSON = (v: string): JSON | undefined => {
    let _v;
    try {
        _v = JSON.parse(v);
    } catch (_) {
        return undefined;
    }
    if (typeof _v !== 'object' || _v === null) {
        return undefined;
    }
    return _v;
};

const validateNumberGenerator = (
    {min, max}: { min?: number | bigint | undefined, max?: number | bigint | undefined }
) => {
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
}
const validateDecimalGenerator = (
    {min, max}: { min?: Decimal | undefined, max?: Decimal | undefined }
) => {
    if (min === undefined) {
        if (max === undefined) {
            return () => true;
        } else {
            return (v: Decimal) => v.comparedTo(max) >= 0;
        }
    } else {
        if (max === undefined) {
            return (v: Decimal) => 0 >= v.comparedTo(min);
        } else {
            return (v: Decimal) => 0 >= v.comparedTo(min) && v.comparedTo(max) >= 0;
        }
    }
}
const validateSmallInt = validateNumberGenerator({min: 0, max: 32767});
const validateInteger = validateNumberGenerator({min: 0, max: 2147483647});
const validateBigInt = validateNumberGenerator({min: 0, max: BigInt('9223372036854775807')});
const validateStringGenerator = (
    {regex, min, max}: { regex?: RegExp | undefined, min?: number | undefined, max?: number | undefined }
) => {
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
}

const createModelUtils = <Columns extends Table['columns']>(
    columns: Columns,
    custom?: {
        parse?: { [key in keyof Columns]?: (v: string) => ColumnTypeByColumns<Columns, key> | undefined }
        validate?: { [key in keyof Columns]?: (v: ColumnTypeByColumns<Columns, key>) => boolean }
    }
): ModelUtils<Columns> => {
    const columnsParseAndValidate = Object.fromEntries(Object.entries(columns).map(([key, val]) => {
        let parseFun = custom?.parse?.[key];
        if (parseFun === undefined) {
            switch (val.type) {
                case 'boolean':
                    parseFun = parseBoolean as any;
                    break;
                case 'smallint':
                case 'integer':
                case 'real':
                case 'double precision':
                    parseFun = parseNumber as any;
                    break;
                case 'bigint':
                    parseFun = parseBigInt as any;
                    break;
                case 'numeric':
                    parseFun = parseDecimal as any;
                    break;
                case 'character':
                case 'character varying':
                case 'text':
                case 'uuid':
                    parseFun = parseString as any;
                    break;
                case 'date':
                case 'timestamp without time zone':
                case 'timestamp with time zone':
                    parseFun = parseDate as any;
                    break;
                case 'json':
                case 'jsonb':
                    parseFun = parseJSON as any;
                    break;
            }
        }

        let validateFun = custom?.validate?.[key];
        if (validateFun === undefined) {
            switch (val.type) {
                case 'smallint':
                    if (val.min !== undefined || val.max !== undefined) {
                        validateFun = validateNumberGenerator({min: val.min, max: val.max}) as any;
                    } else {
                        validateFun = validateSmallInt as any;
                    }
                    break;
                case 'integer':
                    if (val.min !== undefined || val.max !== undefined) {
                        validateFun = validateNumberGenerator({min: val.min, max: val.max}) as any;
                    } else {
                        validateFun = validateInteger as any;
                    }
                    break;
                case 'bigint':
                    if (val.min !== undefined || val.max !== undefined) {
                        validateFun = validateNumberGenerator({min: val.min, max: val.max}) as any;
                    } else {
                        validateFun = validateBigInt as any;
                    }
                    break;
                case 'real':
                case 'double precision':
                    if (val.min !== undefined || val.max !== undefined) {
                        validateFun = validateNumberGenerator({min: val.min, max: val.max}) as any;
                    } else {
                        validateFun = () => true;
                    }
                    break;
                case 'numeric':
                    if (val.min !== undefined || val.max !== undefined) {
                        validateFun = validateDecimalGenerator({min: val.min, max: val.max}) as any;
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

        const parseWithValidate = (v: string, validate: boolean = false) => {
            const parsedValue = parseFun!(v);
            if (validate && parsedValue !== undefined && !validateFun!(parsedValue)) {
                return undefined;
            }
            return parsedValue;
        }
        return [key, {Parse: parseWithValidate, Validate: validateFun}];
    }));
    return {
        Parse: (data, requires, optionals, validate = false) => {
            const result = {} as { [key: string]: any };

            let require: any;
            for (require of requires) {
                if (data[require] === undefined) {
                    return err(`can not parse ${require}`);
                }
                if (validate && !columnsParseAndValidate[require].Validate!(data[require] as any)) {
                    return err(`invalid ${require}`);
                }
                result[require] = columnsParseAndValidate[require].Parse!(data[require]);
            }

            let optional: any;
            for (optional of optionals) {
                if (data[optional] === undefined) {
                    continue;
                }
                if (validate && !columnsParseAndValidate[optional].Validate!(data[optional] as any)) {
                    return err(`invalid ${optional}`);
                }
                result[optional] = columnsParseAndValidate[optional].Parse!(data[optional]);
            }

            return ok(result as any);
        },
        Validate: data => {
            let dataKey: any;
            for (dataKey in data) {
                if (!columnsParseAndValidate[dataKey].Validate!(data[dataKey] as any)) {
                    return err(`invalid ${dataKey}`);
                }
            }
            return ok(undefined);
        },
        ...(columnsParseAndValidate as any)
    };
};

export {createModelUtils};