import { createTable } from '../src/Table';
import { createReference } from '../src/Table';
import {
    getSequenceName,
    generateDropTableSQL,
    generateCreateTableSQL,
    generateDropSequencesSQL,
    generateCreateSequencesSQL
} from '../src/ddl';

const UserGroupTable = createTable({
    schemaName: 'public',
    tableName: 'user_group',
    columns: {
        id: {
            type: 'int2',
            nullable: false,
            default: true,
            defaultValue: ['auto-increment']
        }
    }
});

const UserTable = createTable({
    schemaName: 'public',
    tableName: 'user',
    columns: {
        id: {
            type: 'int4',
            nullable: false,
            default: true,
            defaultValue: ['auto-increment'],
            title: 'ID',
            primary: true
        },
        userGroupID: {
            type: 'int2',
            nullable: false,
            default: false,
            reference: createReference({
                table: UserGroupTable,
                column: 'id',
                onDelete: 'cascade'
            })
        },
        username: {
            type: 'varchar',
            nullable: true,
            default: false
        },
        level: {
            type: 'int2',
            nullable: false,
            default: true,
            defaultValue: ['sql', '1']
        },
        code: {
            type: 'int8',
            nullable: false,
            default: true,
            defaultValue: ['auto-increment'],
            primary: true
        },
        dateRange: {
            type: 'custom(DateRange)',
            nullable: false,
            default: false,
            narrowType: undefined as unknown as [Date, Date]
        }
    }
});

describe('generateCreateSequencesSQL', () => {
    describe('applyIfNotExist: false', () => {
        describe('smallint', () => {
            test('without owner', () => {
                const result = generateCreateSequencesSQL(UserGroupTable, {
                    applyIfNotExist: false
                });

                expect(result).toStrictEqual([
                    'CREATE SEQUENCE "public"."user_group_id_seq" AS SMALLINT'
                ]);
            });
            test('with owner', () => {
                const result = generateCreateSequencesSQL(UserGroupTable, {
                    applyIfNotExist: false,
                    owner: 'USER'
                });

                expect(result).toStrictEqual([
                    'CREATE SEQUENCE "public"."user_group_id_seq" AS SMALLINT OWNER TO USER'
                ]);
            });
        });
        describe('integer and bigint', () => {
            test('without owner', () => {
                const result = generateCreateSequencesSQL(UserTable, {
                    applyIfNotExist: false
                });

                expect(result).toStrictEqual([
                    'CREATE SEQUENCE "public"."user_ID_seq" AS INTEGER',
                    'CREATE SEQUENCE "public"."user_code_seq"'
                ]);
            });
            test('with owner', () => {
                const result = generateCreateSequencesSQL(UserTable, {
                    applyIfNotExist: false,
                    owner: 'USER'
                });

                expect(result).toStrictEqual([
                    'CREATE SEQUENCE "public"."user_ID_seq" AS INTEGER OWNER TO USER',
                    'CREATE SEQUENCE "public"."user_code_seq" OWNER TO USER'
                ]);
            });
        });
    });
    describe('applyIfNotExist: true', () => {
        describe('smallint', () => {
            test('without owner', () => {
                const result = generateCreateSequencesSQL(UserGroupTable, {
                    applyIfNotExist: true
                });

                expect(result).toStrictEqual([
                    'CREATE SEQUENCE IF NOT EXISTS "public"."user_group_id_seq" AS SMALLINT'
                ]);
            });
            test('with owner', () => {
                const result = generateCreateSequencesSQL(UserGroupTable, {
                    applyIfNotExist: true,
                    owner: 'USER'
                });

                expect(result).toStrictEqual([
                    'CREATE SEQUENCE IF NOT EXISTS "public"."user_group_id_seq" AS SMALLINT OWNER TO USER'
                ]);
            });
        });
        describe('integer and bigint', () => {
            test('without owner', () => {
                const result = generateCreateSequencesSQL(UserTable, {
                    applyIfNotExist: true
                });

                expect(result).toStrictEqual([
                    'CREATE SEQUENCE IF NOT EXISTS "public"."user_ID_seq" AS INTEGER',
                    'CREATE SEQUENCE IF NOT EXISTS "public"."user_code_seq"'
                ]);
            });
            test('with owner', () => {
                const result = generateCreateSequencesSQL(UserTable, {
                    applyIfNotExist: true,
                    owner: 'USER'
                });

                expect(result).toStrictEqual([
                    'CREATE SEQUENCE IF NOT EXISTS "public"."user_ID_seq" AS INTEGER OWNER TO USER',
                    'CREATE SEQUENCE IF NOT EXISTS "public"."user_code_seq" OWNER TO USER'
                ]);
            });
        });
    });
});

describe('generateDropSequencesSQL', () => {
    test('applyIfExist: false', () => {
        const result = generateDropSequencesSQL(UserTable, {
            applyIfExist: false
        });

        expect(result).toStrictEqual([
            'DROP SEQUENCE "public"."user_ID_seq"',
            'DROP SEQUENCE "public"."user_code_seq"'
        ]);
    });
    test('applyIfExist: true', () => {
        const result = generateDropSequencesSQL(UserTable, {
            applyIfExist: true
        });

        expect(result).toStrictEqual([
            'DROP IF EXISTS SEQUENCE "public"."user_ID_seq"',
            'DROP IF EXISTS SEQUENCE "public"."user_code_seq"'
        ]);
    });
});

describe('generateCreateTableSQL', () => {
    describe('applyIfNotExist: false', () => {
        describe('isTemp: false', () => {
            test('without owner', () => {
                const result = generateCreateTableSQL(UserTable, {
                    applyIfNotExist: false,
                    isTemp: false
                });

                expect(result).toStrictEqual(
                    `CREATE TABLE "public"."user"("ID" INTEGER DEFAULT NEXTVAL('"public"."user_ID_seq"'::REGCLASS) NOT NULL, ` +
                        '"userGroupID" SMALLINT NOT NULL REFERENCES "public"."user_group"("id") ON UPDATE NO ACTION ON DELETE CASCADE, ' +
                        `"username" CHARACTER VARYING NULL, "level" SMALLINT DEFAULT 1 NOT NULL, "code" BIGINT DEFAULT NEXTVAL('"public"."user_code_seq"'::REGCLASS) NOT NULL, "dateRange" DateRange NOT NULL, ` +
                        'CONSTRAINT "user_pk" PRIMARY KEY("ID", "code"))'
                );
            });
            test('with owner', () => {
                const result = generateCreateTableSQL(UserTable, {
                    applyIfNotExist: false,
                    isTemp: false,
                    owner: 'USER'
                });

                expect(result).toStrictEqual(
                    `CREATE TABLE "public"."user"("ID" INTEGER DEFAULT NEXTVAL('"public"."user_ID_seq"'::REGCLASS) NOT NULL, ` +
                        '"userGroupID" SMALLINT NOT NULL REFERENCES "public"."user_group"("id") ON UPDATE NO ACTION ON DELETE CASCADE, ' +
                        `"username" CHARACTER VARYING NULL, "level" SMALLINT DEFAULT 1 NOT NULL, "code" BIGINT DEFAULT NEXTVAL('"public"."user_code_seq"'::REGCLASS) NOT NULL, "dateRange" DateRange NOT NULL, ` +
                        'CONSTRAINT "user_pk" PRIMARY KEY("ID", "code")) OWNER TO USER'
                );
            });
        });
        describe('isTemp: true', () => {
            test('without owner', () => {
                const result = generateCreateTableSQL(UserTable, {
                    applyIfNotExist: false,
                    isTemp: true
                });

                expect(result).toStrictEqual(
                    `CREATE TEMPORARY TABLE "public"."user"("ID" INTEGER DEFAULT NEXTVAL('"public"."user_ID_seq"'::REGCLASS) NOT NULL, ` +
                        '"userGroupID" SMALLINT NOT NULL REFERENCES "public"."user_group"("id") ON UPDATE NO ACTION ON DELETE CASCADE, ' +
                        `"username" CHARACTER VARYING NULL, "level" SMALLINT DEFAULT 1 NOT NULL, "code" BIGINT DEFAULT NEXTVAL('"public"."user_code_seq"'::REGCLASS) NOT NULL, "dateRange" DateRange NOT NULL, ` +
                        'CONSTRAINT "user_pk" PRIMARY KEY("ID", "code"))'
                );
            });
            test('with owner', () => {
                const result = generateCreateTableSQL(UserTable, {
                    applyIfNotExist: false,
                    isTemp: true,
                    owner: 'USER'
                });

                expect(result).toStrictEqual(
                    `CREATE TEMPORARY TABLE "public"."user"("ID" INTEGER DEFAULT NEXTVAL('"public"."user_ID_seq"'::REGCLASS) NOT NULL, ` +
                        '"userGroupID" SMALLINT NOT NULL REFERENCES "public"."user_group"("id") ON UPDATE NO ACTION ON DELETE CASCADE, ' +
                        `"username" CHARACTER VARYING NULL, "level" SMALLINT DEFAULT 1 NOT NULL, "code" BIGINT DEFAULT NEXTVAL('"public"."user_code_seq"'::REGCLASS) NOT NULL, "dateRange" DateRange NOT NULL, ` +
                        'CONSTRAINT "user_pk" PRIMARY KEY("ID", "code")) OWNER TO USER'
                );
            });
        });
    });
    describe('applyIfNotExist: true', () => {
        describe('isTemp: false', () => {
            test('without owner', () => {
                const result = generateCreateTableSQL(UserTable, {
                    applyIfNotExist: true,
                    isTemp: false
                });

                expect(result).toStrictEqual(
                    `CREATE TABLE IF NOT EXIST "public"."user"("ID" INTEGER DEFAULT NEXTVAL('"public"."user_ID_seq"'::REGCLASS) NOT NULL, ` +
                        '"userGroupID" SMALLINT NOT NULL REFERENCES "public"."user_group"("id") ON UPDATE NO ACTION ON DELETE CASCADE, ' +
                        `"username" CHARACTER VARYING NULL, "level" SMALLINT DEFAULT 1 NOT NULL, "code" BIGINT DEFAULT NEXTVAL('"public"."user_code_seq"'::REGCLASS) NOT NULL, "dateRange" DateRange NOT NULL, ` +
                        'CONSTRAINT "user_pk" PRIMARY KEY("ID", "code"))'
                );
            });
            test('with owner', () => {
                const result = generateCreateTableSQL(UserTable, {
                    applyIfNotExist: true,
                    isTemp: false,
                    owner: 'USER'
                });

                expect(result).toStrictEqual(
                    `CREATE TABLE IF NOT EXIST "public"."user"("ID" INTEGER DEFAULT NEXTVAL('"public"."user_ID_seq"'::REGCLASS) NOT NULL, ` +
                        '"userGroupID" SMALLINT NOT NULL REFERENCES "public"."user_group"("id") ON UPDATE NO ACTION ON DELETE CASCADE, ' +
                        `"username" CHARACTER VARYING NULL, "level" SMALLINT DEFAULT 1 NOT NULL, "code" BIGINT DEFAULT NEXTVAL('"public"."user_code_seq"'::REGCLASS) NOT NULL, "dateRange" DateRange NOT NULL, ` +
                        'CONSTRAINT "user_pk" PRIMARY KEY("ID", "code")) OWNER TO USER'
                );
            });
        });
        describe('isTemp: true', () => {
            test('without owner', () => {
                const result = generateCreateTableSQL(UserTable, {
                    applyIfNotExist: true,
                    isTemp: true
                });

                expect(result).toStrictEqual(
                    `CREATE TEMPORARY TABLE IF NOT EXIST "public"."user"("ID" INTEGER DEFAULT NEXTVAL('"public"."user_ID_seq"'::REGCLASS) NOT NULL, ` +
                        '"userGroupID" SMALLINT NOT NULL REFERENCES "public"."user_group"("id") ON UPDATE NO ACTION ON DELETE CASCADE, ' +
                        `"username" CHARACTER VARYING NULL, "level" SMALLINT DEFAULT 1 NOT NULL, "code" BIGINT DEFAULT NEXTVAL('"public"."user_code_seq"'::REGCLASS) NOT NULL, "dateRange" DateRange NOT NULL, ` +
                        'CONSTRAINT "user_pk" PRIMARY KEY("ID", "code"))'
                );
            });
            test('with owner', () => {
                const result = generateCreateTableSQL(UserTable, {
                    applyIfNotExist: true,
                    isTemp: true,
                    owner: 'USER'
                });

                expect(result).toStrictEqual(
                    `CREATE TEMPORARY TABLE IF NOT EXIST "public"."user"("ID" INTEGER DEFAULT NEXTVAL('"public"."user_ID_seq"'::REGCLASS) NOT NULL, ` +
                        '"userGroupID" SMALLINT NOT NULL REFERENCES "public"."user_group"("id") ON UPDATE NO ACTION ON DELETE CASCADE, ' +
                        `"username" CHARACTER VARYING NULL, "level" SMALLINT DEFAULT 1 NOT NULL, "code" BIGINT DEFAULT NEXTVAL('"public"."user_code_seq"'::REGCLASS) NOT NULL, "dateRange" DateRange NOT NULL, ` +
                        'CONSTRAINT "user_pk" PRIMARY KEY("ID", "code")) OWNER TO USER'
                );
            });
        });
    });
});

describe('generateDropTableSQL', () => {
    test('applyIfExist: true', () => {
        const result = generateDropTableSQL(UserTable, { applyIfExist: false });

        expect(result).toStrictEqual('DROP TABLE "public"."user"');
    });
    test('applyIfExist: true', () => {
        const result = generateDropTableSQL(UserTable, { applyIfExist: true });

        expect(result).toStrictEqual('DROP TABLE IF EXIST "public"."user"');
    });
});

describe('getSequenceName', () => {
    test('sequenceTitle', () => {
        const result = getSequenceName('a', 'b', 'c', {
            title: 'd',
            sequenceTitle: 'e'
        });

        expect(result).toStrictEqual('"a"."e"');
    });
    test('title', () => {
        const result = getSequenceName('a', 'b', 'c', {
            title: 'd'
        });

        expect(result).toStrictEqual('"a"."b_d_seq"');
    });
    test('column', () => {
        const result = getSequenceName('a', 'b', 'c', {});

        expect(result).toStrictEqual('"a"."b_c_seq"');
    });
});
