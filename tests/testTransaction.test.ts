import { Pool } from 'pg';
import { Table } from '../src';
import {
    isEqual,
    testTransaction,
    createTestTableData
} from '../src/testTransaction';

type UserSchema = {
    id: {
        type: number;
        nullable: false;
        default: true;
    };
    username: {
        type: string;
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
            nullable: false,
            default: true,
            defaultValue: ['auto-increment']
        },
        username: {
            type: 'varchar',
            nullable: true,
            default: false
        }
    }
};

describe('isEqual', () => {
    test('primitive equal', () => {
        const result = isEqual(1, 1);

        expect(result).toStrictEqual(true);
    });
    test('not object and null', () => {
        const result = isEqual({}, null);

        expect(result).toStrictEqual(false);
    });
    test('object and array', () => {
        const result = isEqual({ 1: 'a' }, ['a']);

        expect(result).toStrictEqual(false);
    });
    test('object and object', () => {
        const result = isEqual({ a: 1 }, { a: 1, b: 2 });

        expect(result).toStrictEqual(false);
    });
    test('object equal', () => {
        const result = isEqual({ a: 1 }, { a: 1 });

        expect(result).toStrictEqual(true);
    });
});

describe('testTransaction', () => {
    test('init db fails', async () => {
        const mockClient = {
            query: jest
                .fn()
                .mockResolvedValueOnce(undefined) // begin transaction
                .mockResolvedValueOnce(undefined) // create tables
                .mockRejectedValueOnce('a'),
            release: jest.fn()
        };
        const mockPool = {
            connect: jest.fn().mockResolvedValueOnce(mockClient)
        };
        const result = await testTransaction(
            [
                {
                    table: UserTable,
                    startData: [
                        {
                            id: 1
                        }
                    ],
                    finalData: []
                }
            ],
            async () => undefined,
            mockPool as unknown as Pool
        ).catch(v => v);

        expect(result).toStrictEqual('"a"');
        expect(mockClient.query.mock.calls).toStrictEqual([
            ['BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED READ WRITE;'],
            [
                `CREATE SEQUENCE "public"."user_id_seq" AS SMALLINT; CREATE TABLE "public"."user"("id" SMALLINT DEFAULT NEXTVAL('"public"."user_id_seq"'::REGCLASS) NOT NULL, "username" CHARACTER VARYING NULL);`
            ],
            [
                `INSERT INTO "public"."user" ("id", "username") VALUES (1, NULL) RETURNING (TRUE) AS "confirm";`,
                []
            ],
            ['ROLLBACK;']
        ]);
        expect(mockClient.release.mock.calls).toStrictEqual([[]]);
    });
    test('check db fails', async () => {
        const mockClient = {
            query: jest
                .fn()
                .mockResolvedValueOnce(undefined) // begin transaction
                .mockResolvedValueOnce(undefined) // create tables
                .mockResolvedValueOnce({ rows: [{ confirm: true }] })
                .mockRejectedValueOnce('a'),
            release: jest.fn()
        };
        const mockPool = {
            connect: jest.fn().mockResolvedValueOnce(mockClient)
        };
        const result = await testTransaction(
            [
                {
                    table: UserTable,
                    startData: [
                        {
                            id: 1
                        }
                    ],
                    finalData: []
                }
            ],
            async () => undefined,
            mockPool as unknown as Pool
        ).catch(v => v);

        expect(result).toStrictEqual('"a"');
        expect(mockClient.query.mock.calls).toStrictEqual([
            ['BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED READ WRITE;'],
            [
                `CREATE SEQUENCE "public"."user_id_seq" AS SMALLINT; CREATE TABLE "public"."user"("id" SMALLINT DEFAULT NEXTVAL('"public"."user_id_seq"'::REGCLASS) NOT NULL, "username" CHARACTER VARYING NULL);`
            ],
            [
                `INSERT INTO "public"."user" ("id", "username") VALUES (1, NULL) RETURNING (TRUE) AS "confirm";`,
                []
            ],
            [`SELECT "id", "username" FROM "public"."user" WHERE TRUE;`, []],
            ['ROLLBACK;']
        ]);
        expect(mockClient.release.mock.calls).toStrictEqual([[]]);
    });
    test('final data does not match', async () => {
        const mockClient = {
            query: jest
                .fn()
                .mockResolvedValueOnce(undefined) // begin transaction
                .mockResolvedValueOnce(undefined) // create tables
                .mockResolvedValueOnce({ rows: [{ confirm: true }] })
                .mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] }),
            release: jest.fn()
        };
        const mockPool = {
            connect: jest.fn().mockResolvedValueOnce(mockClient)
        };
        const result = await testTransaction(
            [
                {
                    table: UserTable,
                    startData: [
                        {
                            id: 1
                        }
                    ],
                    finalData: [
                        {
                            id: 2
                        },
                        {
                            id: 3
                        }
                    ]
                }
            ],
            async () => undefined,
            mockPool as unknown as Pool
        ).catch(v => v);

        expect(result).toStrictEqual(
            [
                '',
                'final row not found:',
                '{',
                '    "id": 3',
                '}',
                '',
                'db row without match:',
                '{',
                '    "id": 1',
                '}'
            ].join('\n')
        );
        expect(mockClient.query.mock.calls).toStrictEqual([
            ['BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED READ WRITE;'],
            [
                `CREATE SEQUENCE "public"."user_id_seq" AS SMALLINT; CREATE TABLE "public"."user"("id" SMALLINT DEFAULT NEXTVAL('"public"."user_id_seq"'::REGCLASS) NOT NULL, "username" CHARACTER VARYING NULL);`
            ],
            [
                `INSERT INTO "public"."user" ("id", "username") VALUES (1, NULL) RETURNING (TRUE) AS "confirm";`,
                []
            ],
            [`SELECT "id", "username" FROM "public"."user" WHERE TRUE;`, []],
            ['ROLLBACK;']
        ]);
        expect(mockClient.release.mock.calls).toStrictEqual([[]]);
    });
    test('ok rollback', async () => {
        const mockClient = {
            query: jest
                .fn()
                .mockResolvedValueOnce(undefined) // begin transaction
                .mockResolvedValueOnce(undefined) // create tables
                .mockResolvedValueOnce({ rows: [{ confirm: true }] })
                .mockResolvedValueOnce({ rows: [{ id: 2 }] }),
            release: jest.fn()
        };
        const mockPool = {
            connect: jest.fn().mockResolvedValueOnce(mockClient)
        };
        const result = await testTransaction(
            [
                {
                    table: UserTable,
                    startData: [
                        {
                            id: 1
                        }
                    ],
                    finalData: [
                        {
                            id: 2
                        }
                    ]
                }
            ],
            async () => undefined,
            mockPool as unknown as Pool
        );

        expect(result).toStrictEqual(undefined);
        expect(mockClient.query.mock.calls).toStrictEqual([
            ['BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED READ WRITE;'],
            [
                `CREATE SEQUENCE "public"."user_id_seq" AS SMALLINT; CREATE TABLE "public"."user"("id" SMALLINT DEFAULT NEXTVAL('"public"."user_id_seq"'::REGCLASS) NOT NULL, "username" CHARACTER VARYING NULL);`
            ],
            [
                `INSERT INTO "public"."user" ("id", "username") VALUES (1, NULL) RETURNING (TRUE) AS "confirm";`,
                []
            ],
            [`SELECT "id", "username" FROM "public"."user" WHERE TRUE;`, []],
            ['ROLLBACK;']
        ]);
        expect(mockClient.release.mock.calls).toStrictEqual([[]]);
    });
    test('ok commit', async () => {
        const mockClient = {
            query: jest
                .fn()
                .mockResolvedValueOnce(undefined) // begin transaction
                .mockResolvedValueOnce(undefined) // create tables
                .mockResolvedValueOnce({ rows: [{ id: 2 }] }),
            release: jest.fn()
        };
        const mockPool = {
            connect: jest.fn().mockResolvedValueOnce(mockClient)
        };
        const result = await testTransaction(
            [
                {
                    table: UserTable,
                    startData: [],
                    finalData: [
                        {
                            id: 2
                        }
                    ]
                }
            ],
            async () => undefined,
            mockPool as unknown as Pool,
            'serializable',
            false
        );

        expect(result).toStrictEqual(undefined);
        expect(mockClient.query.mock.calls).toStrictEqual([
            ['BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE READ WRITE;'],
            [
                `CREATE SEQUENCE "public"."user_id_seq" AS SMALLINT; CREATE TABLE "public"."user"("id" SMALLINT DEFAULT NEXTVAL('"public"."user_id_seq"'::REGCLASS) NOT NULL, "username" CHARACTER VARYING NULL);`
            ],
            [`SELECT "id", "username" FROM "public"."user" WHERE TRUE;`, []],
            ['COMMIT;']
        ]);
        expect(mockClient.release.mock.calls).toStrictEqual([[]]);
    });
});

test('createTestTableData', () => {
    const result = createTestTableData(
        UserTable,
        [{ id: 1, username: 'a' }],
        [{ id: 2, username: 'b' }]
    );

    expect(result).toStrictEqual({
        table: UserTable,
        startData: [{ id: 1, username: 'a' }],
        finalData: [{ id: 2, username: 'b' }]
    });
});
