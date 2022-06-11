import U from '../../src/U';
import {resolveReturning} from '../../src/entity';

const UserTable = {
    schema: 'public',
    title: 'user',
    columns: {
        id: {
            type: 'smallint',
            nullable: false,
            default: false
        },
        name: {
            type: 'character varying',
            nullable: false,
            default: false,
            title: 'first_and_last_name'
        },
        createdAt: {
            type: 'timestamp with time zone',
            nullable: false,
            default: false
        },
        updatedAt: {
            type: 'timestamp with time zone',
            nullable: false,
            default: false,
            title: 'updated_at'
        }
    }
} as const;

test('empty', () => {
    const result = resolveReturning(_ => ({type: 'boolean', title: undefined}), [], 2, false);
    if (result.ok) {
        throw 'it should not reach here';
    }
    expect(result.error).toBe('<returning> -> empty');
});
test('object-fail', () => {
    const result = resolveReturning(_ => ({type: 'boolean', title: undefined}), [{
        exp: undefined,
        as: 'test'
    }], 2, false);
    if (result.ok) {
        throw 'it should not reach here';
    }
    expect(result.error).toBe('<returning>[test] -> undefined');
});
test('object-neutral', () => {
    const result = resolveReturning(_ => ({type: 'boolean', title: undefined}), [{
        exp: undefined,
        as: 'test'
    }], 2, true);
    if (result.ok) {
        throw 'it should not reach here';
    }
    expect(result.error).toBe('<returning>[test] -> neutral');
});
test('column custom-parse object', () => {
    const result = resolveReturning<keyof typeof UserTable.columns>(
        column => ({...UserTable.columns[column]}), [
        'id',
        'name',
        'createdAt',
        'updatedAt',
        {exp: U.val(2), as: 'test'}
    ] as const, 2, false);
    if (!result.ok) {
        throw 'it should not reach here';
    }
    const {text, params} = result.value;
    expect(text).toBe('"id", "first_and_last_name" AS "name", "createdAt"::TEXT AS "createdAt", '
        + '"updated_at"::TEXT AS "updatedAt", ( $2 ) AS "test"');
    expect(params).toStrictEqual([U.stringify(2)]);
});