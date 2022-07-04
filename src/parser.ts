import Decimal from 'decimal.js';

const boolean = (v: unknown): boolean | undefined => {
    switch (typeof v) {
        case 'boolean':
            return v;
        case 'string':
            switch (v) {
                case 'true':
                    return true;
                case 'false':
                    return false
                default:
                    return undefined;
            }
        default:
            return undefined;
    }
};
const number = (v: unknown): number | undefined => {
    switch (typeof v) {
        case 'number':
            return v;
        case 'string':
            const _v = Number(v);
            return Number.isNaN(_v) ? undefined : _v;
        default:
            return undefined;
    }
};
const integer = (v: unknown): number | undefined => {
    const _v = number(v);
    return _v === undefined ? undefined : Math.trunc(_v);
};
const bigInt = (v: unknown): bigint | undefined => {
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
};
const decimal = (v: unknown): Decimal | undefined => {
    if (v instanceof Decimal) {
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
};
const string = (v: unknown): string | undefined => {
    switch (typeof v) {
        case 'boolean':
        case 'number':
        case 'bigint':
            return v.toString();
        case 'string':
            return v;
        default:
            return undefined;
    }
};
const date = (v: unknown): Date | undefined => {
    switch (typeof v) {
        case 'number':
        case 'string':
            const _v = new Date(v);
            return _v.toString() === 'Invalid Date' ? undefined : _v;
        default:
            return undefined;
    }
};
const json = (v: unknown): JSON | undefined => {
    if (typeof v !== 'string') {
        return undefined;
    }
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

export {
    boolean,
    number,
    integer,
    bigInt,
    decimal,
    string,
    date,
    json
};