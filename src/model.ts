import Decimal from 'decimal.js';
import { Table } from './types/table';
import * as Parser from './parser';
import { err, ok } from 'never-catch';
import { ModelUtils } from './types/model';
import { ColumnTypeByColumns } from './types/postgres';

const smallIntRange = { min: -32768, max: 32767 };
const integerRange = { min: -2147483648, max: 2147483647 };
const bigIntRange = {
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
            return (v: Decimal) => v.comparedTo(max) >= 0;
        }
    } else {
        if (max === undefined) {
            return (v: Decimal) => 0 >= v.comparedTo(min);
        } else {
            return (v: Decimal) => 0 >= v.comparedTo(min) && v.comparedTo(max) >= 0;
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

const createModelUtils = <Columns extends Table['columns']>(
    columns: Columns,
    custom?: {
        parse?: { [key in keyof Columns]?: (v: unknown | undefined) => ColumnTypeByColumns<Columns, key> | undefined };
        validate?: { [key in keyof Columns]?: (v: ColumnTypeByColumns<Columns, key>) => boolean };
    }
): ModelUtils<Columns> => {
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
                            min: val.min ?? smallIntRange.min,
                            max: val.max ?? smallIntRange.max
                        }) as any;
                        break;
                    case 'integer':
                        validateFun = validateNumberGenerator({
                            min: val.min ?? integerRange.min,
                            max: val.max ?? integerRange.max
                        }) as any;
                        break;
                    case 'bigint':
                        validateFun = validateNumberGenerator({
                            min: val.min ?? bigIntRange.min,
                            max: val.max ?? bigIntRange.max
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

            const parseWithValidate = (v: string | undefined, validate: boolean = false) => {
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
        Parse: (data, requires, optionals, validate = false) => {
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

export { createModelUtils };
export { validateNumberGenerator, validateDecimalGenerator, validateStringGenerator };
