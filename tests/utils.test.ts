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
