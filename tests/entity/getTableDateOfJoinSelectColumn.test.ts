import { getTableDataOfJoinSelectColumn } from '../../src/entity';

test('no separator', () => {
    expect(() => getTableDataOfJoinSelectColumn([], 'id')).toThrow('no separator');
});
test('column not found', () => {
    expect(() =>
        getTableDataOfJoinSelectColumn(
            [
                {
                    alias: 'b',
                    table: { schema: 'public', title: 'user', columns: {} }
                }
            ],
            'a_id'
        )
    ).toThrow('column not found');
});
test('one separator', () => {
    const UserTableData = {
        alias: 'a',
        table: {
            schema: 'public',
            title: 'user',
            columns: { id: { type: 'smallint', nullable: false, default: false } }
        } as const
    };
    const result = getTableDataOfJoinSelectColumn([UserTableData], 'a_id');
    expect(result).toStrictEqual(UserTableData);
});
test('multiple separator', () => {
    const UserTableData = {
        alias: 'a',
        table: {
            schema: 'public',
            title: 'user',
            columns: { id: { type: 'smallint', nullable: false, default: false } }
        } as const
    };
    const DepartmentTableData = {
        alias: 'a_id',
        table: {
            schema: 'public',
            title: 'department',
            columns: { id: { type: 'smallint', nullable: false, default: false } }
        } as const
    };
    const result = getTableDataOfJoinSelectColumn([UserTableData, DepartmentTableData], 'a_id_id');
    expect(result).toStrictEqual(DepartmentTableData);
});
