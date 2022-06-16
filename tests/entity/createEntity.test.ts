import U from '../../src/U';
import {createEntity} from '../../src/entity';

const UserTable = {
    schema: 'public',
    title: 'user',
    columns: {
        id: {
            type: 'smallint',
            nullable: false,
            default: 'auto-increment'
        },
        code: {
            type: 'smallint',
            nullable: true,
            default: false
        },
        name: {
            type: 'character varying',
            nullable: false,
            default: true,
            value: `'no-name'`
        },
        job: {
            type: 'character varying',
            nullable: false,
            default: 'value',
            value: 'clerk'
        },
        address: {
            type: 'character varying',
            nullable: false,
            default: false
        },
        createdAt: {
            type: 'timestamp with time zone',
            nullable: false,
            default: 'created-at'
        },
        updatedAt: {
            type: 'timestamp with time zone',
            nullable: false,
            default: 'updated-at'
        }
    }
} as const;
const User = createEntity(UserTable);

const DepartmentTable = {
    schema: 'public',
    title: 'department',
    columns: {
        id: {
            type: 'smallint',
            nullable: false,
            default: 'auto-increment'
        },
        name: {
            type: 'character varying',
            nullable: false,
            default: false
        },
    }
} as const;
const Department = createEntity(DepartmentTable);

describe('select', () => {
    test('where-fail', () => {
        const result = User.select(
            ['id'] as const,
            undefined
        ).getData();
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<select>[where] -> undefined`);
    });
    test('full', () => {
        const result = User.select(
            ['id'] as const,
            true,
            {
                order: [{by: 'id', direction: 'asc'}, {by: 'job', direction: 'desc'}],
                start: BigInt('4'),
                step: 10
            }
        ).getData();
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {sql, params} = result.value;
        expect(sql).toBe('SELECT "id" FROM "public"."user" WHERE TRUE ORDER BY "id" ASCENDING, "job" DESCENDING OFFSET 4 LIMIT 10 ;');
        expect(params).toStrictEqual([]);
    });
});

describe('insert', () => {
    test('empty', () => {
        const result = User.insert(
            [],
            ['id'] as const
        ).getData();
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe('<insert>[values] -> empty');
    });
    test('fail', () => {
        const result = User.insert(
            [{address: U.conOp('Street', undefined)}],
            ['id'] as const
        ).getData();
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe('<insert>[rows][0][address] -> <concat>[1] -> undefined');
    });
    test('neutral', () => {
        const result = User.insert(
            [{address: U.conOp(undefined, undefined)}],
            ['id'] as const,
            {ignoreInValues: true}
        ).getData();
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe('<insert>[rows][0][address] -> neutral');
    });
    test('full', () => {
        jest.useFakeTimers().setSystemTime(new Date('2020-01-01 00:00:00'));

        const now = new Date();
        const result = User.insert(
            [{address: U.val('Street')}],
            ['id'] as const,
            {nullableDefaultColumns: ['code'] as const}
        ).getData();
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {sql, params} = result.value;
        expect(sql).toBe(`INSERT INTO "public"."user" ( "id", "code", "name", "job", "address", "createdAt", "updatedAt" ) VALUES ` +
            `( DEFAULT, NULL, DEFAULT, 'clerk', $1, '${now.toISOString()}', '${now.toISOString()}' ) RETURNING "id" ;`);
        expect(params).toStrictEqual([U.stringify('Street')]);
    });
});

describe('update', () => {
    test('empty', () => {
        const result = Department.update(
            {},
            true,
            ['id'] as const
        ).getData();
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe('<update>[sets] -> empty');
    });
    test('sets-fail', () => {
        const result = Department.update(
            {name: U.conOp('ali', undefined)},
            true,
            ['id'] as const
        ).getData();
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe('<update>[sets][name] -> <concat>[1] -> undefined');
    });
    test('sets-neutral', () => {
        const result = Department.update(
            {name: U.conOp(undefined, undefined)},
            true,
            ['id'] as const,
            {ignoreInSets: true}
        ).getData();
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe('<update>[sets] -> empty');
    });
    test('updated-at', () => {
        jest.useFakeTimers().setSystemTime(new Date('2020-01-01 00:00:00'));

        const result = User.update(
            {name: 'ali'},
            true,
            ['id'] as const
        ).getData();
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {sql, params} = result.value;
        expect(sql).toBe(`UPDATE "public"."user" SET "name" = $1, "updatedAt" = '${new Date().toISOString()}' WHERE TRUE RETURNING "id" ;`);
        expect(params).toStrictEqual([U.stringify('ali')]);
    });
    test('where-fail', () => {
        const result = Department.update(
            {name: 'ali'},
            undefined,
            ['id'] as const
        ).getData();
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<update>[where] -> undefined`);
    });
    test('returning-fail', () => {
        const result = Department.update(
            {name: 'ali'},
            true,
            ['id', {exp: undefined, as: 't'}] as const
        ).getData();
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<update> -> <returning>[t] -> undefined`);
    });
});

describe('delete', () => {
    test('where-fail', () => {
        const result = Department.delete(
            undefined,
            ['id'] as const
        ).getData();
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<delete>[where] -> undefined`);
    });
    test('returning-fail', () => {
        const result = Department.delete(
            true,
            ['id', {exp: undefined, as: 't'}] as const
        ).getData();
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<delete> -> <returning>[t] -> undefined`);
    });
    test('ok', () => {
        const result = Department.delete(
            true,
            ['id'] as const
        ).getData();
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {sql, params} = result.value;
        expect(sql).toBe(`DELETE FROM "public"."department" WHERE TRUE RETURNING "id" ;`);
        expect(params).toStrictEqual([]);
    });
});

describe('join', () => {
    test('full', () => {
        const BuildingTable = {
            schema: 'public',
            title: 'building',
            columns: {
                id: {
                    type: 'smallint',
                    default: false,
                    nullable: false
                }
            }
        } as const;
        const Building = createEntity(BuildingTable);

        const result = User
            .join('usr', 'inner', Department.table, 'dept',
                ({usr, dept}) => usr.colCmp('address', '=', dept.col('name')))
            .join('full', Building.table, 'bld',
                ({usr, dept, bld}) => U.cmpOp(usr.col('id'), '=', U.artOp(dept.col('id'), '+', bld.col('id'))))
            .select(['dept_name', 'usr_id'] as const, true).getData();
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {sql, params} = result.value;
        expect(sql).toBe('SELECT "dept"."name" AS "dept_name", "usr"."id" AS "usr_id" FROM "public"."user" "usr" ' +
            'INNER JOIN "public"."department" "dept" ON "usr"."address" = "dept"."name" ' +
            'FULL OUTER JOIN "public"."building" "bld" ON "usr"."id" = ( "dept"."id" + "bld"."id" ) ' +
            'WHERE TRUE ;');
        expect(params).toStrictEqual([]);
    });
    test('full custom-title', () => {
        const BuildingTable = {
            schema: 'public',
            title: 'building',
            columns: {
                id: {
                    type: 'smallint',
                    default: false,
                    nullable: false,
                    title: 'building_id'
                }
            }
        } as const;
        const Building = createEntity(BuildingTable);

        const result = User
            .join('usr', 'inner', Department.table, 'dept',
                ({usr, dept}) => usr.colCmp('address', '=', dept.col('name')))
            .join('full', Building.table, 'bld',
                ({usr, dept, bld}) => U.cmpOp(usr.col('id'), '=', U.artOp(dept.col('id'), '+', bld.col('id'))))
            .select(['dept_name', 'usr_id', 'bld_id'] as const, true).getData();
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {sql, params} = result.value;
        expect(sql).toBe('SELECT "dept"."name" AS "dept_name", "usr"."id" AS "usr_id", "bld"."building_id" AS "bld_id" FROM "public"."user" "usr" ' +
            'INNER JOIN "public"."department" "dept" ON "usr"."address" = "dept"."name" ' +
            'FULL OUTER JOIN "public"."building" "bld" ON "usr"."id" = ( "dept"."id" + "bld"."building_id" ) ' +
            'WHERE TRUE ;');
        expect(params).toStrictEqual([]);
    });
});
