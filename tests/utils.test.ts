import Decimal from 'decimal.js';
import { Query } from '../src/entity';
import { Schema, Table } from '../src/Table';
import { OperatorCode } from '../src/keywords';
import {
    or,
    and,
    fun,
    not,
    raw,
    Cast,
    json,
    value,
    column,
    concat,
    ignore,
    compare,
    subQuery,
    stringify,
    arithmetic,
    switchCase,
    subQueryExist
} from '../src/utils';

test('value', () => {
    const result = value('a');

    expect(result).toStrictEqual([OperatorCode.Value, 'a']);
});

describe('arithmetic', () => {
    test('two', () => {
        const result = arithmetic(1, '+', 2);

        expect(result).toStrictEqual([OperatorCode.Sum, [1, 2]]);
    });
    test('more', () => {
        const result = arithmetic('+', [1, 2]);

        expect(result).toStrictEqual([OperatorCode.Sum, [1, 2]]);
    });
});

test('json', () => {
    const result = json({ a: 1 }, 'j-', 'b');

    expect(result).toStrictEqual([
        OperatorCode.JsonRemove,
        { a: 1 },
        'b',
        undefined
    ]);
});

test('fun', () => {
    const result = fun('a', ['b', 1], 'c');

    expect(result).toStrictEqual([OperatorCode.Function, 'a', ['b', 1], 'c']);
});

test('switchCase', () => {
    const result = switchCase([{ when: true, then: 1 }], 2);

    expect(result).toStrictEqual([
        OperatorCode.SwitchCase,
        [{ when: true, then: 1 }],
        2
    ]);
});

test('concat', () => {
    const result = concat('a', 'b');

    expect(result).toStrictEqual([OperatorCode.Concat, ['a', 'b']]);
});

test('column', () => {
    const UserTable: Table<{
        id: {
            type: number;
            nullable: false;
            default: false;
        };
    }> = {
        schemaName: 'public',
        tableName: 'user',
        columns: {
            id: {
                type: 'int4',
                nullable: false,
                default: false,
                title: 'userID'
            }
        }
    };
    const result = column(UserTable, 'id', true, 'B');

    expect(result).toStrictEqual([OperatorCode.Column, '"B"."userID"']);
});

test('raw', () => {
    const get = () => ({
        expression: 'a',
        params: ['b']
    });
    const result = raw(get);

    expect(result).toStrictEqual([OperatorCode.Raw, get]);
});

test('ignore', () => {
    const result = ignore('a' as string, 'b');

    expect(result).toStrictEqual([OperatorCode.Ignore, 'a', 'b']);
});

test('not', () => {
    const result = not(true);

    expect(result).toStrictEqual([OperatorCode.Not, true]);
});

test('and', () => {
    const result = and(true, false);

    expect(result).toStrictEqual([OperatorCode.And, [true, false]]);
});

test('or', () => {
    const result = or(true, false);

    expect(result).toStrictEqual([OperatorCode.Or, [true, false]]);
});

test('compare', () => {
    const result = compare(1, '=', 2);

    expect(result).toStrictEqual([OperatorCode.IsEqual, 1, 2, undefined]);
});

test('subQuery', () => {
    const result = subQuery(null as unknown as Query<Schema, []>);

    expect(result).toStrictEqual([OperatorCode.SubQuery, null]);
});

test('subQueryExist', () => {
    const result = subQueryExist(null as unknown as Query<Schema, []>);

    expect(result).toStrictEqual([OperatorCode.SubQueryExist, null]);
});

describe('stringify', () => {
    describe('boolean', () => {
        test('true', () => {
            const result = stringify(true);

            expect(result).toStrictEqual('TRUE');
        });
        test('false', () => {
            const result = stringify(false);

            expect(result).toStrictEqual('FALSE');
        });
    });
    test('number', () => {
        const result = stringify(12);

        expect(result).toStrictEqual('12');
    });
    test('bigint', () => {
        const result = stringify(BigInt('12'));

        expect(result).toStrictEqual('12');
    });
    test('string', () => {
        const result = stringify('hello');

        expect(result).toStrictEqual('hello');
    });
    test('string-inline', () => {
        const result = stringify('hello', true);

        expect(result).toStrictEqual(`'hello'`);
    });
    test('null', () => {
        const result = stringify(null);

        expect(result).toStrictEqual('NULL');
    });
    test('decimal', () => {
        const result = stringify(new Decimal('12.2'));

        expect(result).toStrictEqual('12.2');
    });
    test('decimal-inline', () => {
        const result = stringify(new Decimal('12.2'), true);

        expect(result).toStrictEqual(`'12.2'`);
    });
    test('Date', () => {
        const result = stringify(new Date(1));

        expect(result).toStrictEqual('1970-01-01T00:00:00.001Z');
    });
    test('Date-inline', () => {
        const result = stringify(new Date(1), true);

        expect(result).toStrictEqual(`'1970-01-01T00:00:00.001Z'`);
    });
    test('object', () => {
        const result = stringify(['hello']);

        expect(result).toStrictEqual('["hello"]');
    });
    test('object-inline', () => {
        const result = stringify(['hello'], true);

        expect(result).toStrictEqual(`'["hello"]'::JSONB`);
    });
    test('other', () => {
        expect(() => stringify(() => true)).toThrow(/ is not serializable/);
    });
});

describe('Cast', () => {
    describe('boolean', () => {
        test('null', () => {
            const result = Cast.boolean(null, true);

            expect(result).toStrictEqual(null);
        });
        test('boolean', () => {
            const result = Cast.boolean(true);

            expect(result).toStrictEqual(true);
        });
        test('string-true', () => {
            const result = Cast.boolean('t');

            expect(result).toStrictEqual(true);
        });
        test('string-false', () => {
            const result = Cast.boolean('f');

            expect(result).toStrictEqual(false);
        });
        test('string-other', () => {
            const result = Cast.boolean('a');

            expect(result).toStrictEqual(undefined);
        });
        test('other', () => {
            const result = Cast.boolean(1);

            expect(result).toStrictEqual(undefined);
        });
    });
    describe('number', () => {
        test('null', () => {
            const result = Cast.number(null, true);

            expect(result).toStrictEqual(null);
        });
        test('number', () => {
            const result = Cast.number(1);

            expect(result).toStrictEqual(1);
        });
        test('string', () => {
            const result = Cast.number('1');

            expect(result).toStrictEqual(1);
        });
        test('string-NaN', () => {
            const result = Cast.number('a');

            expect(result).toStrictEqual(undefined);
        });
        test('other', () => {
            const result = Cast.number(true);

            expect(result).toStrictEqual(undefined);
        });
    });
    describe('integer', () => {
        test('null', () => {
            const result = Cast.integer(null, true);

            expect(result).toStrictEqual(null);
        });
        test('number', () => {
            const result = Cast.integer(1.2);

            expect(result).toStrictEqual(1);
        });
        test('other', () => {
            const result = Cast.integer('a');

            expect(result).toStrictEqual(undefined);
        });
    });
    describe('bigInt', () => {
        test('null', () => {
            const result = Cast.bigInt(null, true);

            expect(result).toStrictEqual(null);
        });
        test('bigint', () => {
            const result = Cast.bigInt(BigInt(1));

            expect(result).toStrictEqual(BigInt(1));
        });
        test('number', () => {
            const result = Cast.bigInt(1);

            expect(result).toStrictEqual(BigInt(1));
        });
        test('string', () => {
            const result = Cast.bigInt('1');

            expect(result).toStrictEqual(BigInt(1));
        });
        test('string-other', () => {
            const result = Cast.bigInt('a');

            expect(result).toStrictEqual(undefined);
        });
        test('other', () => {
            const result = Cast.bigInt(true);

            expect(result).toStrictEqual(undefined);
        });
    });
    describe('decimal', () => {
        test('null', () => {
            const result = Cast.decimal(null, true);

            expect(result).toStrictEqual(null);
        });
        test('decimal', () => {
            const result = Cast.decimal(new Decimal('1.2'));

            expect(result).toStrictEqual(new Decimal('1.2'));
        });
        test('number', () => {
            const result = Cast.decimal(1.3);

            expect(result).toStrictEqual(new Decimal('1.3'));
        });
        test('string', () => {
            const result = Cast.decimal('1.2');

            expect(result).toStrictEqual(new Decimal('1.2'));
        });
        test('string-other', () => {
            const result = Cast.decimal('a');

            expect(result).toStrictEqual(undefined);
        });
        test('other', () => {
            const result = Cast.decimal(true);

            expect(result).toStrictEqual(undefined);
        });
    });
    describe('string', () => {
        test('null', () => {
            const result = Cast.string(null, true);

            expect(result).toStrictEqual(null);
        });
        test('boolean', () => {
            const result = Cast.string(true);

            expect(result).toStrictEqual('true');
        });
        test('number', () => {
            const result = Cast.string(1);

            expect(result).toStrictEqual('1');
        });
        test('bigint', () => {
            const result = Cast.string(BigInt(1));

            expect(result).toStrictEqual('1');
        });
        test('string', () => {
            const result = Cast.string('a');

            expect(result).toStrictEqual('a');
        });
        test('other', () => {
            const result = Cast.string(() => true);

            expect(result).toStrictEqual(undefined);
        });
    });
    describe('date', () => {
        test('null', () => {
            const result = Cast.date(null, true);

            expect(result).toStrictEqual(null);
        });
        test('date', () => {
            const result = Cast.date(new Date(1));

            expect(result).toStrictEqual(new Date(1));
        });
        test('number|string', () => {
            const result = Cast.date(1);

            expect(result).toStrictEqual(new Date(1));
        });
        test('number|string-other', () => {
            const result = Cast.date('a');

            expect(result).toStrictEqual(undefined);
        });
        test('other', () => {
            const result = Cast.date(true);

            expect(result).toStrictEqual(undefined);
        });
    });
    describe('json', () => {
        test('null', () => {
            const result = Cast.json(null, true);

            expect(result).toStrictEqual(null);
        });
        test('input: string, result: undefined', () => {
            const result = Cast.json('1');

            expect(result).toStrictEqual(undefined);
        });
        test('input: not-string, result: undefined', () => {
            const result = Cast.json(1);

            expect(result).toStrictEqual(undefined);
        });
        test('input: string, result: json', () => {
            const result = Cast.json('{}');

            expect(result).toStrictEqual({});
        });
        test('input: not-string, result: json', () => {
            const result = Cast.json({});

            expect(result).toStrictEqual({});
        });
        test('input: string, result: not-json', () => {
            const result = Cast.json('a{}');

            expect(result).toStrictEqual(undefined);
        });
    });
});
