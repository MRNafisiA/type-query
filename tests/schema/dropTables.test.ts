import {dropSequencesSQL, dropTables, dropTableSQL} from '../../src/schema';

test('db-ok and resolve-true and tables-only', async () => {
    const table1 = {
        schema: 'public',
        title: 'test_table_1',
        columns: {id: {type: 'smallint', nullable: false, default: false}}
    } as const;
    const table2 = {
        schema: 'public',
        title: 'test_table_2',
        columns: {id: {type: 'smallint', nullable: false, default: false, reference: {table: table1, column: 'id'}}}
    } as const;
    const query = jest.fn();
    query.mockReturnValue(Promise.resolve());
    const dropResult = await dropTables({query} as any, [table1, table2], true);
    expect(dropResult.ok).toBe(true);
    expect(query.mock.calls.length).toBe(2);
    expect(query.mock.calls[0][0]).toBe(dropTableSQL(table2));
    expect(query.mock.calls[1][0]).toBe(dropTableSQL(table1));
});

test('db-ok and no-resolve-true and tables-sequences', async () => {
    const table1 = {
        schema: 'public',
        title: 'test_table_1',
        columns: {id: {type: 'smallint', nullable: false, default: 'auto-increment'}}
    } as const;
    const table2 = {
        schema: 'public',
        title: 'test_table_2',
        columns: {id: {type: 'smallint', nullable: false, default: false}}
    } as const;
    const query = jest.fn();
    query.mockReturnValue(Promise.resolve());
    const dropResult = await dropTables({query} as any, [table1, table2], false);
    expect(dropResult.ok).toBe(true);
    expect(query.mock.calls.length).toBe(3);
    expect(query.mock.calls[0][0]).toBe(dropTableSQL(table1));
    expect(query.mock.calls[1][0]).toBe(dropTableSQL(table2));
    expect(query.mock.calls[2][0]).toBe(dropSequencesSQL(table1)[0]);
});

test('db-fail and table-fail', async () => {
    const table1 = {
        schema: 'public',
        title: 'test_table_1',
        columns: {id: {type: 'smallint', nullable: false, default: 'auto-increment'}}
    } as const;
    const table2 = {
        schema: 'public',
        title: 'test_table_2',
        columns: {id: {type: 'smallint', nullable: false, default: false}}
    } as const;
    const query = jest.fn();
    query.mockReturnValueOnce(Promise.resolve());
    query.mockReturnValueOnce(Promise.reject('mocked db'));
    query.mockReturnValueOnce(Promise.resolve());
    const dropResult = await dropTables({query} as any, [table1, table2], false);
    if (dropResult.ok) {
        throw 'it should not reach here';
    }
    expect(dropResult.error).toStrictEqual({db: 'mocked db', query: dropTableSQL(table2)});
    expect(query.mock.calls.length).toBe(2);
    expect(query.mock.calls[0][0]).toBe(dropTableSQL(table1));
    expect(query.mock.calls[1][0]).toBe(dropTableSQL(table2));
});

test('db-fail and sequence-fail', async () => {
    const table1 = {
        schema: 'public',
        title: 'test_table_1',
        columns: {id: {type: 'smallint', nullable: false, default: 'auto-increment'}}
    } as const;
    const table2 = {
        schema: 'public',
        title: 'test_table_2',
        columns: {id: {type: 'smallint', nullable: false, default: false}}
    } as const;
    const query = jest.fn();
    query.mockReturnValueOnce(Promise.resolve());
    query.mockReturnValueOnce(Promise.resolve());
    query.mockReturnValueOnce(Promise.reject('mocked db'));
    const dropResult = await dropTables({query} as any, [table1, table2], false);
    if (dropResult.ok) {
        throw 'it should not reach here';
    }
    expect(dropResult.error).toStrictEqual({db: 'mocked db', query: dropSequencesSQL(table1)[0]});
    expect(query.mock.calls.length).toBe(3);
    expect(query.mock.calls[0][0]).toBe(dropTableSQL(table1));
    expect(query.mock.calls[1][0]).toBe(dropTableSQL(table2));
    expect(query.mock.calls[2][0]).toBe(dropSequencesSQL(table1)[0]);
});