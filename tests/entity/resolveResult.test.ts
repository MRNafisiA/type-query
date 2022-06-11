import {resolveResult} from '../../src/entity';

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
            default: false
        }
    }
} as const;

test('mode-count', () => {
    const columns = ['id'] as const;
    const mode = ['count', 2] as ['count', 2];
    const result = resolveResult<typeof UserTable.columns, typeof columns, typeof mode>(
        column => UserTable.columns[column].type, columns, [], mode);
    expect(result).toBe(false);
});
test('mode-get-one-fail', () => {
    const columns = ['id'] as const;
    const mode = ['get', 'one'] as ['get', 'one'];
    const result = resolveResult<typeof UserTable.columns, typeof columns, typeof mode>(
        column => UserTable.columns[column].type, columns, [], mode);
    expect(result).toBe(false);
});
test('mode-get-multiple-fail', () => {
    const columns = ['id'] as const;
    const mode = ['get', 3] as ['get', 3];
    const result = resolveResult<typeof UserTable.columns, typeof columns, typeof mode>(
        column => UserTable.columns[column].type, columns, [], mode);
    expect(result).toBe(false);
});
test('mode-get-one-ok', () => {
    const columns = ['id'] as const;
    const mode = ['get', 'one'] as ['get', 'one'];
    const result = resolveResult<typeof UserTable.columns, typeof columns, typeof mode>(
        column => UserTable.columns[column].type, columns, [{id: 12}], mode);
    expect(result).toStrictEqual({id: 12});
});
test('mode-get-multiple-ok', () => {
    const columns = ['id'] as const;
    const mode = ['get', 2] as ['get', 2];
    const result = resolveResult<typeof UserTable.columns, typeof columns, typeof mode>(
        column => UserTable.columns[column].type, columns, [{id: 12}, {id: 13}], mode);
    expect(result).toStrictEqual([{id: 12}, {id: 13}]);
});