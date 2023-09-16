import { Cast } from './cast';
import Decimal from 'decimal.js';
import { Table } from './types/Table';
import { err, ok } from 'never-catch';
import { ModelUtils } from './types/Model';
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

const createModelUtils = <Columns extends Table['columns']>(
    columns: Columns,
    custom?: {
        cast?: { [key in keyof Columns]?: (v: unknown | undefined) => ColumnTypeByColumns<Columns, key> | undefined };
        validate?: { [key in keyof Columns]?: (v: ColumnTypeByColumns<Columns, key>) => boolean };
    }
): ModelUtils<Columns> => {
    const columnsParser = Object.fromEntries(
        Object.entries(columns).map(([key, val]) => {
            let castFun = custom?.cast?.[key];
            if (castFun === undefined) {
                switch (val.type) {
                    case 'boolean':
                        castFun = Cast.boolean as any;
                        break;
                    case 'smallint':
                    case 'integer':
                        castFun = Cast.integer as any;
                        break;
                    case 'real':
                    case 'double precision':
                        castFun = Cast.number as any;
                        break;
                    case 'bigint':
                        castFun = Cast.bigInt as any;
                        break;
                    case 'numeric':
                        castFun = Cast.decimal as any;
                        break;
                    case 'character':
                    case 'character varying':
                    case 'text':
                    case 'uuid':
                        castFun = Cast.string as any;
                        break;
                    case 'date':
                    case 'timestamp without time zone':
                    case 'timestamp with time zone':
                        castFun = Cast.date as any;
                        break;
                    case 'json':
                    case 'jsonb':
                        castFun = Cast.json as any;
                        break;
                }
            }

            let validateFun = custom?.validate?.[key];
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

            const parse = (v: string | undefined) => {
                const castedValue = castFun!(v);
                if (castedValue !== undefined && !validateFun!(castedValue)) {
                    return undefined;
                }
                return castedValue;
            };
            return [key, { Parse: parse }];
        })
    );
    return {
        Parse: (data, requires, optionals) => {
            const result = {} as { [key: string]: any };

            let require: any;
            for (require of requires) {
                if (data[require] === undefined) {
                    return err(require);
                }
                result[require] = columnsParser[require].Parse!(data[require] as any);
                if (result[require] === undefined) {
                    return err(require);
                }
            }

            let optional: any;
            for (optional of optionals) {
                if (data[optional] === undefined) {
                    continue;
                }
                result[optional] = columnsParser[optional].Parse!(data[optional] as any);
                if (result[optional] === undefined) {
                    return err(optional);
                }
            }

            return ok(result as any);
        },
        ...(columnsParser as any)
    };
};

export { createModelUtils };
export { validateNumberGenerator, validateDecimalGenerator, validateStringGenerator };
