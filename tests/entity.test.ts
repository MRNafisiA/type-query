import { ClientBase } from 'pg';
import * as U from '../src/utils';
import { Table } from '../src/Table';
import { err, ok } from 'never-catch';
import { Context, createContext } from '../src/context';
import {
    JoinData,
    createQuery,
    createEntity,
    TableWithAlias,
    createDeleteQuery,
    createInsertQuery,
    createSelectQuery,
    createUpdateQuery,
    createJoinSelectQuery,
    createJoinSelectEntity,
    getTableDataOfJoinSelectColumn
} from '../src/entity';

type UserSchema = {
    id: {
        type: number;
        nullable: false;
        default: true;
    };
    username: {
        type: string;
        nullable: false;
        default: false;
    };
    email: {
        type: string;
        nullable: true;
        default: false;
    };
    level: {
        type: number;
        nullable: true;
        default: true;
    };
    createdAt: {
        type: Date;
        nullable: false;
        default: true;
    };
    isAdmin: {
        type: boolean;
        nullable: false;
        default: true;
    };
};
const UserTable: Table<UserSchema> = {
    schemaName: 'public',
    tableName: 'user',
    columns: {
        id: {
            type: 'int2',
            nullable: false,
            default: true,
            defaultValue: ['auto-increment'],
            title: 'ID'
        },
        username: {
            type: 'varchar',
            nullable: false,
            default: false
        },
        email: {
            type: 'varchar',
            nullable: true,
            default: false
        },
        level: {
            type: 'int2',
            nullable: true,
            default: true,
            defaultValue: ['sql', '1']
        },
        createdAt: {
            type: 'timestamptz',
            nullable: false,
            default: true,
            defaultValue: ['created-at']
        },
        isAdmin: {
            type: 'boolean',
            nullable: false,
            default: true,
            defaultValue: ['js', true]
        }
    }
};
const userContext = createContext(UserTable);

type LaptopSchema = {
    id: {
        type: number;
        nullable: false;
        default: false;
    };
    userID: {
        type: number;
        nullable: false;
        default: false;
    };
};
const LaptopTable: Table<LaptopSchema> = {
    schemaName: 'public',
    tableName: 'laptop',
    columns: {
        id: { type: 'int2', nullable: false, default: false },
        userID: { type: 'int2', nullable: false, default: false }
    }
};
const lContext = createContext(LaptopTable, 'l');
const uContext = createContext(UserTable, 'u');

describe('createEntity', () => {
    const User = createEntity(UserTable);

    test('select', () => {
        const result = User.select(['username'] as const, true).getData();

        expect(result).toStrictEqual(
            ok({
                sql: 'SELECT "username" FROM "public"."user" WHERE TRUE',
                params: []
            })
        );
    });
    test('insert', () => {
        jest.useFakeTimers().setSystemTime(new Date(1));

        const result = User.insert([{ username: 'a' }], [
            'level'
        ] as const).getData();

        expect(result).toStrictEqual(
            ok({
                sql: `INSERT INTO "public"."user" ("ID", "username", "level", "createdAt", "isAdmin") VALUES (DEFAULT, $1, 1, '1970-01-01T00:00:00.001Z', TRUE) RETURNING "level"`,
                params: ['a']
            })
        );

        jest.useRealTimers();
    });
    test('update', () => {
        const result = User.update({ level: null }, true, [
            'level'
        ] as const).getData();

        expect(result).toStrictEqual(
            ok({
                sql: `UPDATE "public"."user" SET "level" = NULL WHERE TRUE RETURNING "level"`,
                params: []
            })
        );
    });
    test('delete', () => {
        const result = User.delete(true, ['level'] as const).getData();

        expect(result).toStrictEqual(
            ok({
                sql: `DELETE FROM "public"."user" WHERE TRUE RETURNING "level"`,
                params: []
            })
        );
    });
    test('join', () => {
        const result = User.join(
            'u',
            'inner',
            LaptopTable,
            'l',
            ({ uContext, lContext }) =>
                lContext.columnsAnd({ userID: ['=', uContext.column('id')] })
        )
            .select(['u_username', 'l_userID'] as const, true)
            .getData();

        expect(result).toStrictEqual(
            ok({
                sql: `SELECT "u"."username" AS "u_username", "l"."userID" AS "l_userID" FROM "public"."user" "u" INNER JOIN "public"."laptop" "l" ON "l"."userID" = "u"."ID" WHERE TRUE`,
                params: []
            })
        );
    });
});

describe('createSelectQuery', () => {
    describe('error', () => {
        test('distinct', () => {
            const result = createSelectQuery(
                userContext,
                UserTable,
                ['id'],
                true,
                { distinct: [{ expression: undefined }] },
                []
            );

            expect(result).toStrictEqual(
                err('select("public"."user") -> distinct -> 0 -> undefined')
            );
        });
        test('returning', () => {
            const result = createSelectQuery(
                userContext,
                UserTable,
                [],
                true,
                {},
                []
            );

            expect(result).toStrictEqual(
                err('select("public"."user") -> returning -> empty')
            );
        });
        test('where', () => {
            const result = createSelectQuery(
                userContext,
                UserTable,
                ['id'],
                U.arithmetic('+', []),
                {},
                []
            );

            expect(result).toStrictEqual(
                err(
                    'select("public"."user") -> where -> sum -> no operands given'
                )
            );
        });
        test('groupBy', () => {
            const result = createSelectQuery(
                userContext,
                UserTable,
                ['id'],
                true,
                {
                    groupBy: [{ expression: undefined }]
                },
                []
            );

            expect(result).toStrictEqual(
                err('select("public"."user") -> groupBy -> 0 -> undefined')
            );
        });
        test('orderBy', () => {
            const result = createSelectQuery(
                userContext,
                UserTable,
                ['id'],
                true,
                {
                    orders: [
                        { by: { expression: undefined }, direction: 'asc' }
                    ]
                },
                []
            );

            expect(result).toStrictEqual(
                err(
                    'select("public"."user") -> orderBy -> 0 -> by -> undefined'
                )
            );
        });
        test('start', () => {
            const result = createSelectQuery(
                userContext,
                UserTable,
                ['id'],
                true,
                {
                    start: BigInt(-1)
                },
                []
            );

            expect(result).toStrictEqual(
                err('select("public"."user") -> start -> invalid')
            );
        });
        test('step', () => {
            const result = createSelectQuery(
                userContext,
                UserTable,
                ['id'],
                true,
                {
                    step: 0
                },
                []
            );

            expect(result).toStrictEqual(
                err('select("public"."user") -> step -> invalid')
            );
        });
    });
    describe('ok', () => {
        test('distinct: true', () => {
            const result = createSelectQuery(
                userContext,
                UserTable,
                ['id'],
                true,
                {
                    distinct: true
                },
                []
            );

            expect(result).toStrictEqual(
                ok({
                    sql: 'SELECT DISTINCT "ID" AS "id" FROM "public"."user" WHERE TRUE',
                    params: []
                })
            );
        });
        test('distinct: array', () => {
            const result = createSelectQuery(
                userContext,
                UserTable,
                ['id'],
                true,
                {
                    distinct: ['id',{expression:1}]
                },
                []
            );

            expect(result).toStrictEqual(
                ok({
                    sql: 'SELECT DISTINCT ON("ID", 1) "ID" AS "id" FROM "public"."user" WHERE TRUE',
                    params: []
                })
            );
        });
        test('full', () => {
            const result = createSelectQuery(
                userContext,
                UserTable,
                ['id'],
                context =>
                    (context as Context<UserSchema>).columnsAnd({
                        username: ['=', 'a']
                    }),
                {
                    groupBy: context => [
                        'id',
                        {
                            expression: U.arithmetic(
                                context.column('id') as number,
                                '+',
                                1
                            )
                        }
                    ],
                    orders: context => [
                        { by: 'username', direction: 'asc' },
                        {
                            by: {
                                expression: U.arithmetic(
                                    context.column('id') as number,
                                    '+',
                                    2
                                )
                            },
                            direction: 'desc'
                        }
                    ],
                    start: BigInt(3),
                    step: 4
                },
                ['b']
            );

            expect(result).toStrictEqual(
                ok({
                    sql: 'SELECT "ID" AS "id" FROM "public"."user" WHERE "username" = $2 GROUP BY "ID", ("ID" + 1) ORDER BY "username" ASC, ("ID" + 2) DESC OFFSET 3 LIMIT 4',
                    params: ['b', 'a']
                })
            );
        });
    });
});

describe('createInsertQuery', () => {
    describe('error', () => {
        test('rows', () => {
            const result = createInsertQuery(
                userContext,
                UserTable,
                [],
                [],
                {},
                []
            );

            expect(result).toStrictEqual(
                err('insert("public"."user") -> rows -> empty')
            );
        });
        test('returning', () => {
            const result = createInsertQuery(
                userContext,
                UserTable,
                [{ username: 'a' }],
                [{ expression: undefined, name: 'b' }],
                {},
                []
            );

            expect(result).toStrictEqual(
                err('insert("public"."user") -> returning -> b -> undefined')
            );
        });
        test('no value', () => {
            const result = createInsertQuery(
                userContext,
                UserTable,
                [{}],
                [],
                {},
                []
            );

            expect(result).toStrictEqual(
                err(
                    'insert("public"."user") -> rows -> 0 -> username -> no-value'
                )
            );
        });
    });
    test('ok', () => {
        jest.useFakeTimers().setSystemTime(new Date(1));

        const result = createInsertQuery(
            userContext,
            UserTable,
            [
                {
                    username: 'a'
                }
            ],
            ['id', 'username'],
            {
                nullableDefaultColumns: ['email']
            },
            ['b']
        );

        expect(result).toStrictEqual(
            ok({
                sql: `INSERT INTO "public"."user" ("ID", "username", "email", "level", "createdAt", "isAdmin") VALUES (DEFAULT, $2, NULL, 1, '1970-01-01T00:00:00.001Z', TRUE) RETURNING "ID" AS "id", "username"`,
                params: ['b', 'a']
            })
        );

        jest.useRealTimers();
    });
});

describe('createUpdateQuery', () => {
    describe('error', () => {
        test('undefined key', () => {
            const result = createUpdateQuery(
                userContext,
                UserTable,
                { username: U.concat() },
                true,
                [],
                []
            );

            expect(result).toStrictEqual(
                err(
                    'update("public"."user") -> sets -> username -> concat -> no operands given'
                )
            );
        });
        test('empty sets', () => {
            const result = createUpdateQuery(
                userContext,
                UserTable,
                {},
                true,
                [],
                []
            );

            expect(result).toStrictEqual(
                err('update("public"."user") -> sets -> empty')
            );
        });
        test('where', () => {
            const result = createUpdateQuery(
                userContext,
                UserTable,
                { username: 'a' },
                U.arithmetic('+', []),
                [],
                []
            );

            expect(result).toStrictEqual(
                err(
                    'update("public"."user") -> where -> sum -> no operands given'
                )
            );
        });
        test('returning', () => {
            const result = createUpdateQuery(
                userContext,
                UserTable,
                { username: 'a' },
                true,
                [{ expression: undefined, name: 'b' }],
                []
            );

            expect(result).toStrictEqual(
                err('update("public"."user") -> returning -> b -> undefined')
            );
        });
    });
    test('ok', () => {
        type JobSchema = {
            id: {
                type: number;
                nullable: false;
                default: false;
            };
            title: {
                type: string;
                nullable: false;
                default: false;
            };
            updatedAt: {
                type: Date;
                nullable: false;
                default: true;
            };
        };
        const JobTable: Table<JobSchema> = {
            schemaName: 'public',
            tableName: 'job',
            columns: {
                id: {
                    type: 'int2',
                    nullable: false,
                    default: false
                },
                title: {
                    type: 'varchar',
                    nullable: false,
                    default: false
                },
                updatedAt: {
                    type: 'timestamptz',
                    nullable: false,
                    default: true,
                    defaultValue: ['updated-at']
                }
            }
        };
        jest.useFakeTimers().setSystemTime(new Date(1));

        const result = createUpdateQuery(
            userContext,
            JobTable,
            { id: undefined, title: 'a' },
            true,
            ['updatedAt'],
            ['b']
        );

        expect(result).toStrictEqual(
            ok({
                sql: `UPDATE "public"."job" SET "title" = $2, "updatedAt" = '1970-01-01T00:00:00.001Z' WHERE TRUE RETURNING "updatedAt"`,
                params: ['b', 'a']
            })
        );

        jest.useRealTimers();
    });
});

describe('createDeleteQuery', () => {
    describe('error', () => {
        test('where', () => {
            const result = createDeleteQuery(
                userContext,
                UserTable,
                [],
                U.arithmetic('+', []),
                []
            );

            expect(result).toStrictEqual(
                err(
                    'delete("public"."user") -> where -> sum -> no operands given'
                )
            );
        });
        test('returning', () => {
            const result = createDeleteQuery(
                userContext,
                UserTable,
                [{ expression: undefined, name: 'b' }],
                true,
                []
            );

            expect(result).toStrictEqual(
                err('delete("public"."user") -> returning -> b -> undefined')
            );
        });
    });
    test('ok', () => {
        const result = createDeleteQuery(
            userContext,
            UserTable,
            ['username'],
            true,
            []
        );

        expect(result).toStrictEqual(
            ok({
                sql: `DELETE FROM "public"."user" WHERE TRUE RETURNING "username"`,
                params: []
            })
        );
    });
});

describe('createJoinSelectQuery', () => {
    describe('error', () => {
        test('returning', () => {
            const result = createJoinSelectQuery(
                { uContext, lContext },
                {
                    table: UserTable,
                    alias: 'u'
                },
                [
                    {
                        table: LaptopTable,
                        alias: 'l',
                        joinType: 'inner',
                        on: true
                    }
                ],
                [],
                true,
                {},
                []
            );

            expect(result).toStrictEqual(
                err('join-select("public"."user") -> returning -> empty')
            );
        });
        test('join', () => {
            const result = createJoinSelectQuery(
                { uContext, lContext },
                {
                    table: UserTable,
                    alias: 'u'
                },
                [
                    {
                        table: LaptopTable,
                        alias: 'laptop',
                        joinType: 'inner',
                        on: U.arithmetic('+', [])
                    }
                ],
                ['u_id'],
                true,
                {},
                []
            );

            expect(result).toStrictEqual(
                err(
                    `join-select("public"."user") -> join -> 0 -> sum -> no operands given`
                )
            );
        });
        test('where', () => {
            const result = createJoinSelectQuery(
                { uContext, lContext },
                {
                    table: UserTable,
                    alias: 'u'
                },
                [
                    {
                        table: LaptopTable,
                        alias: 'laptop',
                        joinType: 'inner',
                        on: true
                    }
                ],
                ['u_id'],
                U.arithmetic('+', []),
                {},
                []
            );

            expect(result).toStrictEqual(
                err(
                    'join-select("public"."user") -> where -> sum -> no operands given'
                )
            );
        });
        test('groupBy', () => {
            const result = createJoinSelectQuery(
                { uContext, lContext },
                {
                    table: UserTable,
                    alias: 'u'
                },
                [
                    {
                        table: LaptopTable,
                        alias: 'laptop',
                        joinType: 'inner',
                        on: true
                    }
                ],
                ['u_id'],
                true,
                {
                    groupBy: [{ expression: undefined }]
                },
                []
            );

            expect(result).toStrictEqual(
                err('join-select("public"."user") -> groupBy -> 0 -> undefined')
            );
        });
        test('orderBy', () => {
            const result = createJoinSelectQuery(
                { uContext, lContext },
                {
                    table: UserTable,
                    alias: 'u'
                },
                [
                    {
                        table: LaptopTable,
                        alias: 'laptop',
                        joinType: 'inner',
                        on: true
                    }
                ],
                ['u_id'],
                true,
                {
                    orders: [
                        { by: { expression: undefined }, direction: 'asc' }
                    ]
                },
                []
            );

            expect(result).toStrictEqual(
                err(
                    'join-select("public"."user") -> orderBy -> 0 -> by -> undefined'
                )
            );
        });
        test('start', () => {
            const result = createJoinSelectQuery(
                { uContext, lContext },
                {
                    table: UserTable,
                    alias: 'u'
                },
                [
                    {
                        table: LaptopTable,
                        alias: 'laptop',
                        joinType: 'inner',
                        on: true
                    }
                ],
                ['u_id'],
                true,
                {
                    start: BigInt(-1)
                },
                []
            );

            expect(result).toStrictEqual(
                err('join-select("public"."user") -> start -> invalid')
            );
        });
        test('step', () => {
            const result = createJoinSelectQuery(
                { uContext, lContext },
                {
                    table: UserTable,
                    alias: 'u'
                },
                [
                    {
                        table: LaptopTable,
                        alias: 'laptop',
                        joinType: 'inner',
                        on: true
                    }
                ],
                ['u_id'],
                true,
                {
                    step: 0
                },
                []
            );

            expect(result).toStrictEqual(
                err('join-select("public"."user") -> step -> invalid')
            );
        });
    });
    describe('ok', () => {
        test('distinct: true', () => {
            const result = createJoinSelectQuery(
                { uContext, lContext },
                {
                    table: UserTable,
                    alias: 'u'
                },
                [
                    {
                        table: LaptopTable,
                        alias: 'l',
                        joinType: 'inner',
                        on: false
                    }
                ],
                ['u_id'],
                true,
                {
                    distinct: true
                },
                []
            );

            expect(result).toStrictEqual(
                ok({
                    sql: 'SELECT DISTINCT "u"."ID" AS "u_id" FROM "public"."user" "u" INNER JOIN "public"."laptop" "l" ON FALSE WHERE TRUE',
                    params: []
                })
            );
        });
        test('distinct: array', () => {
            const result = createJoinSelectQuery(
                { uContext, lContext },
                {
                    table: UserTable,
                    alias: 'u'
                },
                [
                    {
                        table: LaptopTable,
                        alias: 'l',
                        joinType: 'inner',
                        on: false
                    }
                ],
                ['u_id'],
                true,
                {
                    distinct: ['u_id']
                },
                []
            );

            expect(result).toStrictEqual(
                ok({
                    sql: 'SELECT DISTINCT ON("u"."ID") "u"."ID" AS "u_id" FROM "public"."user" "u" INNER JOIN "public"."laptop" "l" ON FALSE WHERE TRUE',
                    params: []
                })
            );
        });
        test('full', () => {
            const result = createJoinSelectQuery(
                { uContext, lContext },
                {
                    table: UserTable,
                    alias: 'u'
                },
                [
                    {
                        table: LaptopTable,
                        alias: 'l',
                        joinType: 'inner',
                        on: ({
                            uContext,
                            lContext
                        }: {
                            uContext: Context<UserSchema>;
                            lContext: Context<LaptopSchema>;
                        }) =>
                            uContext.columnsAnd({
                                id: ['=', lContext.column('userID')]
                            })
                    } as unknown as TableWithAlias & JoinData
                ],
                ['u_id'],
                ({ uContext }) =>
                    (uContext as Context<UserSchema>).columnsAnd({
                        username: ['=', 'a']
                    }),
                {
                    groupBy: ({ uContext }) => [
                        'u_id',
                        {
                            expression: U.arithmetic(
                                uContext.column('id') as number,
                                '+',
                                1
                            )
                        }
                    ],
                    orders: ({ uContext }) => [
                        {
                            by: 'u_username',
                            direction: 'asc'
                        },
                        {
                            by: {
                                expression: U.arithmetic(
                                    uContext.column('id') as number,
                                    '+',
                                    2
                                )
                            },
                            direction: 'desc'
                        }
                    ],
                    start: BigInt(1),
                    step: 2
                },
                ['b']
            );

            expect(result).toStrictEqual(
                ok({
                    sql: 'SELECT "u"."ID" AS "u_id" FROM "public"."user" "u" INNER JOIN "public"."laptop" "l" ON "u"."ID" = "l"."userID" WHERE "u"."username" = $2 GROUP BY "u"."ID", ("u"."ID" + 1) ORDER BY "u"."username" ASC, ("u"."ID" + 2) DESC OFFSET 1 LIMIT 2',
                    params: ['b', 'a']
                })
            );
        });
    });
});

describe('createJoinSelectEntity', () => {
    const UserJoin = createJoinSelectEntity<
        { u: UserSchema; l: LaptopSchema },
        {
            [key in keyof UserSchema as `u_${key}`]: UserSchema[key];
        } & {
            [key in keyof LaptopSchema as `l_${key}`]: LaptopSchema[key];
        }
    >(
        { table: UserTable, alias: 'u' },
        [{ table: LaptopTable, alias: 'l', joinType: 'inner', on: true }],
        { uContext, lContext }
    );

    type MonitorSchema = {
        laptopID: {
            type: number;
            nullable: false;
            default: false;
        };
        model: {
            type: string;
            nullable: false;
            default: false;
        };
    };
    const MonitorTable: Table<MonitorSchema> = {
        schemaName: 'public',
        tableName: 'monitor',
        columns: {
            laptopID: {
                type: 'int2',
                nullable: false,
                default: false
            },
            model: {
                type: 'varchar',
                nullable: false,
                default: false
            }
        }
    };

    test('select', () => {
        const result = UserJoin.select(
            ['u_username', 'l_userID'] as const,
            false
        ).getData();

        expect(result).toStrictEqual(
            ok({
                sql: `SELECT "u"."username" AS "u_username", "l"."userID" AS "l_userID" FROM "public"."user" "u" INNER JOIN "public"."laptop" "l" ON TRUE WHERE FALSE`,
                params: []
            })
        );
    });
    test('join', () => {
        const result = UserJoin.join(
            'inner',
            MonitorTable,
            'm',
            ({ lContext, mContext }) =>
                lContext.columnsAnd({ id: ['=', mContext.column('laptopID')] })
        )
            .select(['u_username', 'l_userID', 'm_model'] as const, false)
            .getData();

        expect(result).toStrictEqual(
            ok({
                sql:
                    `SELECT "u"."username" AS "u_username", "l"."userID" AS "l_userID", "m"."model" AS "m_model" ` +
                    `FROM "public"."user" "u" INNER JOIN "public"."laptop" "l" ON TRUE INNER JOIN "public"."monitor" "m" ON "l"."id" = "m"."laptopID" WHERE FALSE`,
                params: []
            })
        );
    });
});

describe('getTableDataOfJoinSelectColumn', () => {
    type PhoneSchema = {
        phone_id: {
            type: number;
            nullable: false;
            default: false;
        };
    };
    const PhoneTable: Table<PhoneSchema> = {
        schemaName: 'public',
        tableName: 'phone',
        columns: {
            phone_id: {
                type: 'int2',
                nullable: false,
                default: false
            }
        }
    };

    test('no separator', () => {
        expect(() => getTableDataOfJoinSelectColumn([], 'a')).toThrow(
            'no separator'
        );
    });
    test('column not found', () => {
        expect(() =>
            getTableDataOfJoinSelectColumn(
                [
                    {
                        table: PhoneTable,
                        alias: 'p_phone'
                    }
                ],
                'a_b'
            )
        ).toThrow('column not found');
    });
    test('ok', () => {
        const result = getTableDataOfJoinSelectColumn(
            [
                {
                    table: PhoneTable,
                    alias: 'p_phone'
                }
            ],
            'p_phone_phone_id'
        );

        expect(result).toStrictEqual({ table: PhoneTable, alias: 'p_phone' });
    });
});

describe('createQuery', () => {
    describe('err', () => {
        test('getData', () => {
            const mockCreateQueryData = jest.fn().mockReturnValueOnce(err('a'));
            const queryDataResult = createQuery(mockCreateQueryData).getData();

            expect(queryDataResult).toStrictEqual(err('a'));
        });
        test('execute', async () => {
            const mockCreateQueryData = jest.fn().mockReturnValueOnce(err('a'));
            const queryDataResult = await createQuery(
                mockCreateQueryData
            ).execute({} as ClientBase, []);

            expect(queryDataResult).toStrictEqual(err('a'));
        });
    });
    test('ok', async () => {
        const mockCreateQueryData = jest
            .fn()
            .mockImplementationOnce((params: string[]) =>
                ok({ sql: 'a', params: [...params, 'b'] })
            );
        const mockClient = {
            query: jest.fn().mockReturnValueOnce(Promise.resolve({ rows: [] }))
        };
        const queryResult = createQuery(mockCreateQueryData);
        const queryDataResult = queryResult.getData(['c']);
        const executeResult = await queryResult.execute(
            mockClient as unknown as ClientBase,
            []
        );

        expect(queryDataResult).toStrictEqual(
            ok({ sql: 'a', params: ['c', 'b'] })
        );
        expect(executeResult).toStrictEqual(ok([]));
        expect(mockCreateQueryData.mock.calls).toStrictEqual([[['c']]]);
        expect(mockClient.query.mock.calls).toStrictEqual([['a;', ['c', 'b']]]);
    });
    test('throw', async () => {
        const mockCreateQueryData = jest
            .fn()
            .mockReturnValueOnce(ok({ sql: 'a', params: ['b'] }));
        const mockClient = {
            query: jest.fn().mockReturnValueOnce(Promise.reject('c'))
        };
        const queryResult = createQuery(mockCreateQueryData);
        const executeResult = await queryResult.execute(
            mockClient as unknown as ClientBase,
            []
        );

        expect(executeResult).toStrictEqual(err('c'));
    });
});
