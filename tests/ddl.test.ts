import './__init__';
import { Table } from '../src';
import {
    getSequenceName,
    generateDropTableSQL,
    generateCreateTableSQL,
    generateDropSequencesSQL,
    generateCreateSequencesSQL
} from '../src/ddl';

type UserGroupSchema = {
    id: {
        type: number;
        nullable: false;
        default: true;
    };
};
const UserGroupTable: Table<UserGroupSchema> = {
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
};

type UserSchema = {
    id: {
        type: number;
        nullable: false;
        default: true;
    };
    userGroupID: {
        type: number;
        nullable: false;
        default: false;
    };
    username: {
        type: string;
        nullable: true;
        default: false;
    };
    level: {
        type: number;
        nullable: false;
        default: true;
    };
    code: {
        type: bigint;
        nullable: false;
        default: true;
    };
};
const UserTable: Table<UserSchema> = {
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
            reference: {
                table: UserGroupTable,
                column: 'id',
                onDelete: 'cascade'
            }
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
        }
    }
};

describe('generateCreateSequencesSQL', () => {
    test('smallint', () => {
        const result = generateCreateSequencesSQL(UserGroupTable);

        expect(result).toStrictEqual([
            'CREATE SEQUENCE "public"."user_group_id_seq" AS SMALLINT'
        ]);
    });
    test('integer and bigint', () => {
        const result = generateCreateSequencesSQL(UserTable);

        expect(result).toStrictEqual([
            'CREATE SEQUENCE "public"."user_ID_seq" AS INTEGER',
            'CREATE SEQUENCE "public"."user_code_seq"'
        ]);
    });
});
test('generateDropSequencesSQL', () => {
    const result = generateDropSequencesSQL(UserTable);

    expect(result).toStrictEqual([
        'DROP SEQUENCE "public"."user_ID_seq"',
        'DROP SEQUENCE "public"."user_code_seq"'
    ]);
});
test('generateCreateTableSQL', () => {
    const result = generateCreateTableSQL(UserTable);

    expect(result).toStrictEqual(
        `CREATE TABLE "public"."user"("ID" INTEGER DEFAULT NEXTVAL('"public"."user_ID_seq"'::REGCLASS) NOT NULL, ` +
            `"userGroupID" SMALLINT NOT NULL REFERENCES "public"."user_group"("id") ON UPDATE NO ACTION ON DELETE CASCADE, ` +
            `"username" CHARACTER VARYING NULL, "level" SMALLINT DEFAULT 1 NOT NULL, "code" BIGINT DEFAULT NEXTVAL('"public"."user_code_seq"'::REGCLASS) NOT NULL, ` +
            `CONSTRAINT "user_pk" PRIMARY KEY("ID", "code"))`
    );
});
test('generateDropTableSQL', () => {
    const result = generateDropTableSQL(UserTable);

    expect(result).toStrictEqual('DROP TABLE "public"."user"');
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
