import Decimal from 'decimal.js';
import { JSON as Json } from './types/Json';

type NullableType<V extends boolean, T> = V extends true ? T | null : T;

const Cast = {
    boolean: <N extends boolean>(v: unknown, nullable: N): NullableType<N, boolean> | undefined => {
        if (nullable && (v === null || (typeof v === 'string' && v.toLowerCase() === 'null'))) {
            return null as NullableType<N, boolean>;
        }
        switch (typeof v) {
            case 'boolean':
                return v;
            case 'string':
                switch (v) {
                    case 'true':
                        return true;
                    case 'false':
                        return false;
                    default:
                        return undefined;
                }
            default:
                return undefined;
        }
    },
    number: <N extends boolean>(v: unknown, nullable: N): NullableType<N, number> | undefined => {
        if (nullable && (v === null || (typeof v === 'string' && v.toLowerCase() === 'null'))) {
            return null as NullableType<N, number>;
        }
        switch (typeof v) {
            case 'number':
                return v;
            case 'string':
                const _v = Number(v);
                return Number.isNaN(_v) ? undefined : _v;
            default:
                return undefined;
        }
    },
    integer: <N extends boolean>(v: unknown, nullable: N): NullableType<N, number> | undefined => {
        if (nullable && (v === null || (typeof v === 'string' && v.toLowerCase() === 'null'))) {
            return null as NullableType<N, number>;
        }
        const _v = Cast.number(v, false);
        return _v === undefined ? undefined : Math.trunc(_v);
    },
    bigInt: <N extends boolean>(v: unknown, nullable: N): NullableType<N, bigint> | undefined => {
        if (nullable && (v === null || (typeof v === 'string' && v.toLowerCase() === 'null'))) {
            return null as NullableType<N, bigint>;
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
    decimal: <N extends boolean>(v: unknown, nullable: N): NullableType<N, Decimal> | undefined => {
        if (nullable && (v === null || (typeof v === 'string' && v.toLowerCase() === 'null'))) {
            return null as NullableType<N, Decimal>;
        }
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
    },
    string: <N extends boolean>(v: unknown, nullable: N): NullableType<N, string> | undefined => {
        if (nullable && (v === null || (typeof v === 'string' && v.toLowerCase() === 'null'))) {
            return null as NullableType<N, string>;
        }
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
    },
    date: <N extends boolean>(v: unknown, nullable: N): NullableType<N, Date> | undefined => {
        if (nullable && (v === null || (typeof v === 'string' && v.toLowerCase() === 'null'))) {
            return null as NullableType<N, Date>;
        }
        if (v instanceof Date) {
            return v;
        }
        switch (typeof v) {
            case 'number':
            case 'string':
                const _v = new Date(v);
                return _v.toString() === 'Invalid Date' ? undefined : _v;
            default:
                return undefined;
        }
    },
    json: <N extends boolean>(v: unknown, nullable: N): NullableType<N, Json> | undefined => {
        if (nullable && (v === null || (typeof v === 'string' && v.toLowerCase() === 'null'))) {
            return null as NullableType<N, Json>;
        }
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
    }
};

export { Cast };
