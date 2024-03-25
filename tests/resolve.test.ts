import './__init__';
import * as U from '../src/utils';
import { Query } from '../src/entity';
import { err, ok } from 'never-catch';
import { Schema, Table } from '../src/Table';
import {
    partialQuery,
    resolveColumn,
    resolveExpression,
    resolveResult,
    resolveReturning
} from '../src/resolve';

type UserSchema = {
    id: {
        type: number;
        nullable: true;
        default: false;
    };
};
const UserTable: Table<UserSchema> = {
    schemaName: 'public',
    tableName: 'user',
    columns: {
        id: {
            type: 'int2',
            nullable: true,
            default: false,
            title: 'ID'
        }
    }
};

test('partialQuery', () => {
    const result = partialQuery('a', ['b']);

    expect(result).toStrictEqual({ text: 'a', params: ['b'] });
});

describe('resolveExpression', () => {
    describe('ignore false', () => {
        test('undefined', () => {
            const result = resolveExpression(undefined, 1, false);

            expect(result).toStrictEqual(err('undefined'));
        });
        test('Value: undefined', () => {
            const result = resolveExpression(U.value(undefined), 1, false);

            expect(result).toStrictEqual(err('wrapped value -> undefined'));
        });
        test('IsNull, IsNotNull, IsTrue, IsFalse, Not', () => {
            const result = resolveExpression(
                U.compare(undefined, '= true'),
                1,
                false
            );

            expect(result).toStrictEqual(err('is true -> undefined'));
        });
        describe('Sum, Subtract, Multiply, Divide, Power, Concat, And, Or', () => {
            test('undefined', () => {
                const result = resolveExpression(
                    U.arithmetic(undefined, '+', 1),
                    1,
                    false
                );

                expect(result).toStrictEqual(err('sum -> 0 -> undefined'));
            });
            test('empty array', () => {
                const result = resolveExpression(
                    U.arithmetic('+', []),
                    1,
                    false
                );

                expect(result).toStrictEqual(err('sum -> no operands given'));
            });
        });
        test('Function', () => {
            const result = resolveExpression(
                U.fun('a', [undefined], 'b'),
                1,
                false
            );

            expect(result).toStrictEqual(
                err('function -> parameters -> 0 -> undefined')
            );
        });
        describe('SwitchCase', () => {
            test('when', () => {
                const result = resolveExpression(
                    U.switchCase([{ when: undefined, then: 1 }], 2),
                    1,
                    false
                );

                expect(result).toStrictEqual(
                    err('switch statement -> cases -> 0 -> when -> undefined')
                );
            });
            test('then', () => {
                const result = resolveExpression(
                    U.switchCase([{ when: false, then: undefined }], 1),
                    1,
                    false
                );

                expect(result).toStrictEqual(
                    err('switch statement -> cases -> 0 -> then -> undefined')
                );
            });
            test('empty cases', () => {
                const result = resolveExpression(U.switchCase([], 1), 1, false);

                expect(result).toStrictEqual(
                    err('switch statement -> cases -> empty')
                );
            });
            test('otherwise', () => {
                const result = resolveExpression(
                    U.switchCase([{ when: false, then: 1 }], undefined),
                    1,
                    false
                );

                expect(result).toStrictEqual(
                    err('switch statement -> otherwise -> undefined')
                );
            });
        });
        describe('IsEqual, IsNotEqual, IsGreater, IsGreaterEqual, IsLess, IsLessEqual, Like, JsonExist, JsonRightExist, JsonLeftExist, JsonRemove, JsonIndex, JsonIndexText', () => {
            test('expression1', () => {
                const result = resolveExpression(
                    U.compare(undefined, '=', 1),
                    1,
                    false
                );

                expect(result).toStrictEqual(
                    err('is equal -> first operand -> undefined')
                );
            });
            test('expression2', () => {
                const result = resolveExpression(
                    U.compare(1, '=', undefined),
                    1,
                    false
                );

                expect(result).toStrictEqual(
                    err('is equal -> second operand -> undefined')
                );
            });
        });
        describe('InList, NotInList, LikeAll, LikeSome, JsonSomeExist, JsonAllExist, JsonRemoveAll', () => {
            test('expression', () => {
                const result = resolveExpression(
                    U.compare(undefined, 'in', [1]),
                    1,
                    false
                );

                expect(result).toStrictEqual(
                    err('is inside of -> first operand -> undefined')
                );
            });
            test('undefined items', () => {
                const result = resolveExpression(
                    U.compare(1, 'in', [undefined]),
                    1,
                    false
                );

                expect(result).toStrictEqual(
                    err('is inside of -> second operand -> 0 -> undefined')
                );
            });
            test('empty items', () => {
                const result = resolveExpression(
                    U.compare(1, 'in', []),
                    1,
                    false
                );

                expect(result).toStrictEqual(
                    err('is inside of -> second operand -> empty')
                );
            });
        });
        describe('Between', () => {
            test('expression', () => {
                const result = resolveExpression(
                    U.compare(undefined, 'between', 1, 2),
                    1,
                    false
                );

                expect(result).toStrictEqual(
                    err('is in between -> first operand -> undefined')
                );
            });
            test('startExpression', () => {
                const result = resolveExpression(
                    U.compare(1, 'between', undefined, 2),
                    1,
                    false
                );

                expect(result).toStrictEqual(
                    err('is in between -> second operand -> undefined')
                );
            });
            test('endExpression', () => {
                const result = resolveExpression(
                    U.compare(1, 'between', 2, undefined),
                    1,
                    false
                );

                expect(result).toStrictEqual(
                    err('is in between -> third operand -> undefined')
                );
            });
        });
    });
    describe('ignore independent', () => {
        const randomBoolean = Math.random() > 0.5;
        test('inline primitive', () => {
            const result = resolveExpression(null, 1, randomBoolean);

            expect(result).toStrictEqual(ok({ text: 'NULL', params: [] }));
        });
        test('string', () => {
            const result = resolveExpression('a', 2, randomBoolean);

            expect(result).toStrictEqual(ok({ text: '$2', params: ['a'] }));
        });
        test('object', () => {
            const result = resolveExpression({ a: 1 }, 2, randomBoolean);

            expect(result).toStrictEqual(
                ok({ text: '$2::JSONB', params: [JSON.stringify({ a: 1 })] })
            );
        });
        test('Value', () => {
            const result = resolveExpression(U.value(1), 2, randomBoolean);

            expect(result).toStrictEqual(ok({ text: '$2', params: ['1'] }));
        });
        describe('IsNull, IsNotNull, IsTrue, IsFalse, Not', () => {
            test('IsNull', () => {
                const result = resolveExpression(
                    U.compare(null, '= null'),
                    1,
                    randomBoolean
                );

                expect(result).toStrictEqual(
                    ok({ text: 'NULL IS NULL', params: [] })
                );
            });
            test('IsNotNull', () => {
                const result = resolveExpression(
                    U.compare(null, '!= null'),
                    1,
                    randomBoolean
                );

                expect(result).toStrictEqual(
                    ok({ text: 'NULL IS NOT NULL', params: [] })
                );
            });
            test('IsTrue', () => {
                const result = resolveExpression(
                    U.compare(false, '= true'),
                    1,
                    randomBoolean
                );

                expect(result).toStrictEqual(ok({ text: 'FALSE', params: [] }));
            });
            test('IsFalse, Not', () => {
                const result = resolveExpression(
                    U.compare(false, '= false'),
                    1,
                    randomBoolean
                );

                expect(result).toStrictEqual(
                    ok({ text: 'NOT FALSE', params: [] })
                );
            });
        });
        describe('Sum, Subtract, Multiply, Divide, Power, Concat, And, Or', () => {
            test('single', () => {
                const result = resolveExpression(
                    U.arithmetic('+', [1]),
                    1,
                    randomBoolean
                );

                expect(result).toStrictEqual(ok({ text: '1', params: [] }));
            });
            test('Sum', () => {
                const result = resolveExpression(
                    U.arithmetic('+', [1, 2]),
                    1,
                    randomBoolean
                );

                expect(result).toStrictEqual(
                    ok({ text: '(1 + 2)', params: [] })
                );
            });
            test('Subtract', () => {
                const result = resolveExpression(
                    U.arithmetic('-', [1, 2]),
                    1,
                    randomBoolean
                );

                expect(result).toStrictEqual(
                    ok({ text: '(1 - 2)', params: [] })
                );
            });
            test('Multiply', () => {
                const result = resolveExpression(
                    U.arithmetic('*', [1, 2]),
                    1,
                    randomBoolean
                );

                expect(result).toStrictEqual(
                    ok({ text: '(1 * 2)', params: [] })
                );
            });
            test('Divide', () => {
                const result = resolveExpression(
                    U.arithmetic('/', [1, 2]),
                    1,
                    randomBoolean
                );

                expect(result).toStrictEqual(
                    ok({ text: '(1 / 2)', params: [] })
                );
            });
            test('Concat', () => {
                const result = resolveExpression(
                    U.concat('a', 'b'),
                    2,
                    randomBoolean
                );

                expect(result).toStrictEqual(
                    ok({ text: `($2 || $3)`, params: ['a', 'b'] })
                );
            });
            test('And', () => {
                const result = resolveExpression(
                    U.and(true, false),
                    1,
                    randomBoolean
                );

                expect(result).toStrictEqual(
                    ok({ text: '(TRUE AND FALSE)', params: [] })
                );
            });
            test('Or', () => {
                const result = resolveExpression(
                    U.or(false, true),
                    1,
                    randomBoolean
                );

                expect(result).toStrictEqual(
                    ok({ text: '(FALSE OR TRUE)', params: [] })
                );
            });
            test('Power', () => {
                const result = resolveExpression(
                    U.arithmetic('**', [1, 2, 3]),
                    1,
                    randomBoolean
                );

                expect(result).toStrictEqual(
                    ok({ text: 'POWER(1, POWER(2, 3))', params: [] })
                );
            });
        });
        test('Function', () => {
            const result = resolveExpression(
                U.fun('a', [1, 'b'], 'c'),
                2,
                randomBoolean
            );

            expect(result).toStrictEqual(
                ok({ text: 'a(1, $2)c', params: ['b'] })
            );
        });
        test('SwitchCase', () => {
            const result = resolveExpression(
                U.switchCase([{ when: true, then: 'a' }], 'b'),
                2,
                randomBoolean
            );

            expect(result).toStrictEqual(
                ok({
                    text: 'CASE WHEN TRUE THEN $2 ELSE $3 END',
                    params: ['a', 'b']
                })
            );
        });
        test('Column', () => {
            const column = U.column(UserTable, 'id', false, undefined);

            const result = resolveExpression(column, 1, randomBoolean);

            expect(result).toStrictEqual(
                ok({
                    text: '"ID"',
                    params: []
                })
            );
        });
        test('Raw', () => {
            const result = resolveExpression(
                U.raw(paramsStart => ({
                    expression: `$${paramsStart}`,
                    params: ['a']
                })),
                2,
                randomBoolean
            );

            expect(result).toStrictEqual(
                ok({
                    text: `$2`,
                    params: ['a']
                })
            );
        });
        describe('ignore', () => {
            test('expression', () => {
                const result = resolveExpression(
                    U.ignore('a' as string, 'b'),
                    2,
                    randomBoolean
                );

                expect(result).toStrictEqual(
                    ok({
                        text: `$2`,
                        params: ['a']
                    })
                );
            });
            test('otherwise', () => {
                const result = resolveExpression(
                    U.ignore(undefined as string | undefined, 'b'),
                    2,
                    randomBoolean
                );

                expect(result).toStrictEqual(
                    ok({
                        text: `$2`,
                        params: ['b']
                    })
                );
            });
        });
        describe('IsEqual, IsNotEqual, IsGreater, IsGreaterEqual, IsLess, IsLessEqual, Like, JsonExist, JsonRightExist, JsonLeftExist, JsonRemove, JsonIndex, JsonIndexText', () => {
            test('IsEqual', () => {
                const result = resolveExpression(
                    U.compare('a', '=', 'b'),
                    2,
                    randomBoolean
                );

                expect(result).toStrictEqual(
                    ok({ text: '$2 = $3', params: ['a', 'b'] })
                );
            });
            test('IsNotEqual', () => {
                const result = resolveExpression(
                    U.compare('a', '!=', 'b'),
                    2,
                    randomBoolean
                );

                expect(result).toStrictEqual(
                    ok({ text: '$2 <> $3', params: ['a', 'b'] })
                );
            });
            test('IsGreater', () => {
                const result = resolveExpression(
                    U.compare('a', '>', 'b'),
                    2,
                    randomBoolean
                );

                expect(result).toStrictEqual(
                    ok({ text: '$2 > $3', params: ['a', 'b'] })
                );
            });
            test('IsGreaterEqual', () => {
                const result = resolveExpression(
                    U.compare('a', '>=', 'b'),
                    2,
                    randomBoolean
                );

                expect(result).toStrictEqual(
                    ok({ text: '$2 >= $3', params: ['a', 'b'] })
                );
            });
            test('IsLess', () => {
                const result = resolveExpression(
                    U.compare('a', '<', 'b'),
                    2,
                    randomBoolean
                );

                expect(result).toStrictEqual(
                    ok({ text: '$2 < $3', params: ['a', 'b'] })
                );
            });
            test('IsLessEqual', () => {
                const result = resolveExpression(
                    U.compare('a', '<=', 'b'),
                    2,
                    randomBoolean
                );

                expect(result).toStrictEqual(
                    ok({ text: '$2 <= $3', params: ['a', 'b'] })
                );
            });
            test('Like', () => {
                const result = resolveExpression(
                    U.compare('a', 'like', 'b'),
                    2,
                    randomBoolean
                );

                expect(result).toStrictEqual(
                    ok({ text: '$2 LIKE $3', params: ['a', 'b'] })
                );
            });
            test('JsonExist', () => {
                const result = resolveExpression(
                    U.compare({ a: 1 }, '?', 'b'),
                    2,
                    randomBoolean
                );

                expect(result).toStrictEqual(
                    ok({
                        text: '$2::JSONB ? $3',
                        params: [JSON.stringify({ a: 1 }), 'b']
                    })
                );
            });
            test('JsonRightExist', () => {
                const result = resolveExpression(
                    U.compare({ a: 1 }, '@>', { b: 2 }),
                    2,
                    randomBoolean
                );

                expect(result).toStrictEqual(
                    ok({
                        text: '$2::JSONB @> $3::JSONB',
                        params: [
                            JSON.stringify({ a: 1 }),
                            JSON.stringify({ b: 2 })
                        ]
                    })
                );
            });
            test('JsonLeftExist', () => {
                const result = resolveExpression(
                    U.compare({ a: 1 }, '<@', { b: 2 }),
                    2,
                    randomBoolean
                );

                expect(result).toStrictEqual(
                    ok({
                        text: '$2::JSONB <@ $3::JSONB',
                        params: [
                            JSON.stringify({ a: 1 }),
                            JSON.stringify({ b: 2 })
                        ]
                    })
                );
            });
            test('JsonRemove', () => {
                const result = resolveExpression(
                    U.json({ a: 1 }, 'j-', 'b'),
                    2,
                    randomBoolean
                );

                expect(result).toStrictEqual(
                    ok({
                        text: '$2::JSONB - $3',
                        params: [JSON.stringify({ a: 1 }), 'b']
                    })
                );
            });
            test('JsonIndex', () => {
                const result = resolveExpression(
                    U.json({ a: 1 }, '->', 'b'),
                    2,
                    randomBoolean
                );

                expect(result).toStrictEqual(
                    ok({
                        text: '$2::JSONB -> $3',
                        params: [JSON.stringify({ a: 1 }), 'b']
                    })
                );
            });
            describe('JsonIndexText', () => {
                test('without cast', () => {
                    const result = resolveExpression(
                        U.json({ a: 1 }, '->>', 'b'),
                        2,
                        randomBoolean
                    );

                    expect(result).toStrictEqual(
                        ok({
                            text: '$2::JSONB ->> $3',
                            params: [JSON.stringify({ a: 1 }), 'b']
                        })
                    );
                });
                test('with cast', () => {
                    const result = resolveExpression(
                        U.json({ a: 1 }, '->>', 'b', 'c'),
                        2,
                        randomBoolean
                    );

                    expect(result).toStrictEqual(
                        ok({
                            text: '($2::JSONB ->> $3)c',
                            params: [JSON.stringify({ a: 1 }), 'b']
                        })
                    );
                });
            });
        });
        describe('InList, NotInList, LikeAll, LikeSome, JsonSomeExist, JsonAllExist, JsonRemoveAll', () => {
            describe('single', () => {
                test('InList', () => {
                    const result = resolveExpression(
                        U.compare('a', 'in', ['b']),
                        2,
                        randomBoolean
                    );

                    expect(result).toStrictEqual(
                        ok({ text: '$2 = $3', params: ['a', 'b'] })
                    );
                });
                test('NotInList', () => {
                    const result = resolveExpression(
                        U.compare('a', 'not in', ['b']),
                        2,
                        randomBoolean
                    );

                    expect(result).toStrictEqual(
                        ok({ text: '$2 <> $3', params: ['a', 'b'] })
                    );
                });
                test('LikeAll', () => {
                    const result = resolveExpression(
                        U.compare('a', 'like all', ['b']),
                        2,
                        randomBoolean
                    );

                    expect(result).toStrictEqual(
                        ok({ text: '$2 LIKE $3', params: ['a', 'b'] })
                    );
                });
                test('LikeSome', () => {
                    const result = resolveExpression(
                        U.compare('a', 'like some', ['b']),
                        2,
                        randomBoolean
                    );

                    expect(result).toStrictEqual(
                        ok({ text: '$2 LIKE $3', params: ['a', 'b'] })
                    );
                });
                test('JsonSomeExist', () => {
                    const result = resolveExpression(
                        U.compare(['a'], '?|', ['b']),
                        2,
                        randomBoolean
                    );

                    expect(result).toStrictEqual(
                        ok({
                            text: '$2::JSONB ? $3',
                            params: [JSON.stringify(['a']), 'b']
                        })
                    );
                });
                test('JsonAllExist', () => {
                    const result = resolveExpression(
                        U.compare(['a'], '?&', ['b']),
                        2,
                        randomBoolean
                    );

                    expect(result).toStrictEqual(
                        ok({
                            text: '$2::JSONB ? $3',
                            params: [JSON.stringify(['a']), 'b']
                        })
                    );
                });
                test('JsonRemoveAll', () => {
                    const result = resolveExpression(
                        U.json(['a'], 'j- Array', ['b']),
                        2,
                        randomBoolean
                    );

                    expect(result).toStrictEqual(
                        ok({
                            text: '$2::JSONB - $3',
                            params: [JSON.stringify(['a']), 'b']
                        })
                    );
                });
            });
            describe('multiple', () => {
                test('InList', () => {
                    const result = resolveExpression(
                        U.compare('a', 'in', ['b', 'c']),
                        2,
                        randomBoolean
                    );

                    expect(result).toStrictEqual(
                        ok({ text: '$2 IN ($3, $4)', params: ['a', 'b', 'c'] })
                    );
                });
                test('NotInList', () => {
                    const result = resolveExpression(
                        U.compare('a', 'not in', ['b', 'c']),
                        2,
                        randomBoolean
                    );

                    expect(result).toStrictEqual(
                        ok({
                            text: '$2 NOT IN ($3, $4)',
                            params: ['a', 'b', 'c']
                        })
                    );
                });
                test('LikeAll', () => {
                    const result = resolveExpression(
                        U.compare('a', 'like all', ['b', 'c']),
                        2,
                        randomBoolean
                    );

                    expect(result).toStrictEqual(
                        ok({
                            text: '$2 LIKE ALL(ARRAY[$3, $4])',
                            params: ['a', 'b', 'c']
                        })
                    );
                });
                test('LikeSome', () => {
                    const result = resolveExpression(
                        U.compare('a', 'like some', ['b', 'c']),
                        2,
                        randomBoolean
                    );

                    expect(result).toStrictEqual(
                        ok({
                            text: '$2 LIKE SOME(ARRAY[$3, $4])',
                            params: ['a', 'b', 'c']
                        })
                    );
                });
                test('JsonSomeExist', () => {
                    const result = resolveExpression(
                        U.compare(['a'], '?|', ['b', 'c']),
                        2,
                        randomBoolean
                    );

                    expect(result).toStrictEqual(
                        ok({
                            text: '$2::JSONB ?| ARRAY[$3, $4]',
                            params: [JSON.stringify(['a']), 'b', 'c']
                        })
                    );
                });
                test('JsonAllExist', () => {
                    const result = resolveExpression(
                        U.compare(['a'], '?&', ['b', 'c']),
                        2,
                        randomBoolean
                    );

                    expect(result).toStrictEqual(
                        ok({
                            text: '$2::JSONB ?& ARRAY[$3, $4]',
                            params: [JSON.stringify(['a']), 'b', 'c']
                        })
                    );
                });
                test('JsonRemoveAll', () => {
                    const result = resolveExpression(
                        U.json(['a'], 'j- Array', ['b', 'c']),
                        2,
                        randomBoolean
                    );

                    expect(result).toStrictEqual(
                        ok({
                            text: '$2::JSONB - ARRAY[$3, $4]',
                            params: [JSON.stringify(['a']), 'b', 'c']
                        })
                    );
                });
            });
        });
        test('Between', () => {
            const result = resolveExpression(
                U.compare('a', 'between', 'b', 'c'),
                2,
                randomBoolean
            );

            expect(result).toStrictEqual(
                ok({ text: '$2 BETWEEN $3 AND $4', params: ['a', 'b', 'c'] })
            );
        });
        describe('SubQuery, SubQueryExist', () => {
            test('err', () => {
                const query = { getData: () => err('a') } as Query<Schema, []>;
                const result = resolveExpression(
                    U.subQuery(query),
                    1,
                    randomBoolean
                );

                expect(result).toStrictEqual(err('sub-query -> a'));
            });
            test('SubQuery', () => {
                const query = {
                    getData: (params: string[]) =>
                        ok({
                            sql: `$${params.length + 1}`,
                            params: [...params, 'a']
                        })
                } as Query<Schema, []>;
                const result = resolveExpression(
                    U.subQuery(query),
                    2,
                    randomBoolean
                );

                expect(result).toStrictEqual(
                    ok({ text: '($2)', params: [undefined, 'a'] })
                );
            });
            test('SubQueryExist', () => {
                const query = {
                    getData: (params: string[]) =>
                        ok({
                            sql: `$${params.length + 1}`,
                            params: [...params, 'a']
                        })
                } as Query<Schema, []>;
                const result = resolveExpression(
                    U.subQueryExist(query),
                    2,
                    randomBoolean
                );

                expect(result).toStrictEqual(
                    ok({ text: 'EXISTS($2)', params: [undefined, 'a'] })
                );
            });
        });
    });
    describe('ignore true', () => {
        test('undefined', () => {
            const result = resolveExpression(undefined, 1, true);

            expect(result).toStrictEqual(ok({ text: '', params: [] }));
        });
        test('Value: undefined', () => {
            const result = resolveExpression(U.value(undefined), 1, true);

            expect(result).toStrictEqual(ok({ text: '', params: [] }));
        });
        test('IsNull, IsNotNull, IsTrue, IsFalse, Not', () => {
            const result = resolveExpression(
                U.compare(undefined, '= true'),
                1,
                true
            );

            expect(result).toStrictEqual(ok({ text: '', params: [] }));
        });
        test('Sum, Subtract, Multiply, Divide, Power, Concat, And, Or', () => {
            const result = resolveExpression(
                U.arithmetic('+', [undefined]),
                1,
                true
            );

            expect(result).toStrictEqual(ok({ text: '', params: [] }));
        });
        test('Function', () => {
            const result = resolveExpression(
                U.fun('a', [undefined], 'b'),
                1,
                true
            );

            expect(result).toStrictEqual(ok({ text: '', params: [] }));
        });
        describe('SwitchCase', () => {
            test('without cases, without otherwise', () => {
                const result = resolveExpression(
                    U.switchCase([], undefined),
                    1,
                    true
                );

                expect(result).toStrictEqual(ok({ text: '', params: [] }));
            });
            test('with cases, without otherwise', () => {
                const result = resolveExpression(
                    U.switchCase(
                        [
                            { when: true, then: 'a' },
                            { when: undefined, then: 'b' },
                            {
                                when: true,
                                then: undefined
                            }
                        ],
                        undefined
                    ),
                    2,
                    true
                );

                expect(result).toStrictEqual(
                    ok({ text: 'CASE WHEN TRUE THEN $2 END', params: ['a'] })
                );
            });
            test('without cases, with otherwise', () => {
                const result = resolveExpression(
                    U.switchCase([], 'a'),
                    2,
                    true
                );

                expect(result).toStrictEqual(ok({ text: '$2', params: ['a'] }));
            });
        });
        describe('IsEqual, IsNotEqual, IsGreater, IsGreaterEqual, IsLess, IsLessEqual, Like, JsonExist, JsonRightExist, JsonLeftExist, JsonRemove, JsonIndex, JsonIndexText', () => {
            test('expression1', () => {
                const result = resolveExpression(
                    U.compare(undefined, '=', 1),
                    1,
                    true
                );

                expect(result).toStrictEqual(ok({ text: '', params: [] }));
            });
            test('expression2', () => {
                const result = resolveExpression(
                    U.compare(1, '=', undefined),
                    1,
                    true
                );

                expect(result).toStrictEqual(ok({ text: '', params: [] }));
            });
        });
        describe('InList, NotInList, LikeAll, LikeSome, JsonSomeExist, JsonAllExist, JsonRemoveAll', () => {
            test('undefined in expression', () => {
                const result = resolveExpression(
                    U.compare(undefined, 'in', [1]),
                    1,
                    true
                );

                expect(result).toStrictEqual(ok({ text: '', params: [] }));
            });
            test('undefined in items', () => {
                const result = resolveExpression(
                    U.compare(1, 'in', [undefined]),
                    1,
                    true
                );

                expect(result).toStrictEqual(ok({ text: '', params: [] }));
            });
            test('empty items', () => {
                const result = resolveExpression(
                    U.compare('a', 'in', []),
                    2,
                    true
                );

                expect(result).toStrictEqual(ok({ text: '', params: [] }));
            });
        });
        describe('Between', () => {
            test('expression', () => {
                const result = resolveExpression(
                    U.compare(undefined, 'between', 1, 2),
                    1,
                    true
                );

                expect(result).toStrictEqual(ok({ text: '', params: [] }));
            });
            test('startExpression', () => {
                const result = resolveExpression(
                    U.compare(1, 'between', undefined, 2),
                    1,
                    true
                );

                expect(result).toStrictEqual(ok({ text: '', params: [] }));
            });
            test('endExpression', () => {
                const result = resolveExpression(
                    U.compare(1, 'between', 2, undefined),
                    1,
                    true
                );

                expect(result).toStrictEqual(ok({ text: '', params: [] }));
            });
        });
    });
});

describe('resolveColumn', () => {
    test('full: false', () => {
        const result = resolveColumn(UserTable, 'id', false);

        expect(result).toStrictEqual('"ID"');
    });
    test('full: true, with alias', () => {
        const result = resolveColumn(UserTable, 'id', true, 'A');

        expect(result).toStrictEqual('"A"."ID"');
    });
    test('full: true, without alias', () => {
        const result = resolveColumn(UserTable, 'id', true);

        expect(result).toStrictEqual('"public"."user"."ID"');
    });
});

describe('resolveReturning', () => {
    const getColumnTitleAndAlias = (column: string): [string, undefined] => [
        column,
        undefined
    ];
    test('empty', () => {
        const result = resolveReturning(getColumnTitleAndAlias, [], 1);

        expect(result).toStrictEqual(err('returning -> empty'));
    });
    test('customColumn: undefined', () => {
        const result = resolveReturning(
            getColumnTitleAndAlias,
            [
                {
                    expression: undefined,
                    name: 'a'
                }
            ],
            1
        );

        expect(result).toStrictEqual(err('returning -> a -> undefined'));
    });
    test('customColumn', () => {
        const result = resolveReturning(
            getColumnTitleAndAlias,
            [
                {
                    expression: 'b',
                    name: 'a'
                }
            ],
            2
        );

        expect(result).toStrictEqual(
            ok({ text: '($2) AS "a"', params: ['b'] })
        );
    });
    test('without title, without alias', () => {
        const result = resolveReturning(() => [undefined, undefined], ['a'], 1);

        expect(result).toStrictEqual(ok({ text: '"a"', params: [] }));
    });
    test('without title, with alias', () => {
        const result = resolveReturning(() => [undefined, 'B'], ['B_a'], 1);

        expect(result).toStrictEqual(
            ok({ text: '"B"."a" AS "B_a"', params: [] })
        );
    });
    test('with title, without alias', () => {
        const result = resolveReturning(() => ['b', undefined], ['a'], 1);

        expect(result).toStrictEqual(ok({ text: '"b" AS "a"', params: [] }));
    });
    test('with title, with alias', () => {
        const result = resolveReturning(
            () => ['a', 'B'] as [string, string],
            ['B_c'],
            1
        );

        expect(result).toStrictEqual(
            ok({ text: '"B"."a" AS "B_c"', params: [] })
        );
    });
});

describe('resolveResult', () => {
    describe('mode:count', () => {
        test('err', () => {
            const result = resolveResult([], ['count', 1]);

            expect(result).toStrictEqual(err(false));
        });
        test('ok', () => {
            const result = resolveResult([], ['count', 0]);

            expect(result).toStrictEqual(ok(undefined));
        });
    });
    describe('mode:get', () => {
        test('err one', () => {
            const result = resolveResult([], ['get', 'one']);

            expect(result).toStrictEqual(err(false));
        });
        test('err number', () => {
            const result = resolveResult([], ['get', 1]);

            expect(result).toStrictEqual(err(false));
        });
        test('ok one', () => {
            const result = resolveResult([{ a: 1 }], ['get', 'one']);

            expect(result).toStrictEqual(ok({ a: 1 }));
        });
        test('ok number', () => {
            const result = resolveResult([{ a: 1 }, { b: 2 }], ['get', 2]);

            expect(result).toStrictEqual(ok([{ a: 1 }, { b: 2 }]));
        });
    });
});
