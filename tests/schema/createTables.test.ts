import { createSequencesSQL, createTables, createTableSQL } from '../../src/schema';

test('db-ok and resolve-true and tables-only', async () => {
    const table1 = {
        schema: 'public',
        title: 'test_table_1',
        columns: { id: { type: 'smallint', nullable: false, default: false } }
    } as const;
    const table2 = {
        schema: 'public',
        title: 'test_table_2',
        columns: {
            id: {
                type: 'smallint',
                nullable: false,
                default: false,
                reference: { table: table1, column: 'id' }
            }
        }
    } as const;
    const query = jest.fn();
    query.mockReturnValue(Promise.resolve());
    const createResult = await createTables({ query } as any, [table2, table1], true);
    expect(createResult.ok).toBe(true);
    expect(query.mock.calls.length).toBe(2);
    expect(query.mock.calls[0][0]).toBe(createTableSQL(table1));
    expect(query.mock.calls[1][0]).toBe(createTableSQL(table2));
});

test('db-ok and no-resolve-true and tables-sequences', async () => {
    const table1 = {
        schema: 'public',
        title: 'test_table_1',
        columns: { id: { type: 'smallint', nullable: false, default: 'auto-increment' } }
    } as const;
    const table2 = {
        schema: 'public',
        title: 'test_table_2',
        columns: { id: { type: 'smallint', nullable: false, default: false } }
    } as const;
    const query = jest.fn();
    query.mockReturnValue(Promise.resolve());
    const createResult = await createTables({ query } as any, [table1, table2], false);
    expect(createResult.ok).toBe(true);
    expect(query.mock.calls.length).toBe(3);
    expect(query.mock.calls[0][0]).toBe(createSequencesSQL(table1)[0]);
    expect(query.mock.calls[1][0]).toBe(createTableSQL(table1));
    expect(query.mock.calls[2][0]).toBe(createTableSQL(table2));
});

test('db-fail and table-fail', async () => {
    const table1 = {
        schema: 'public',
        title: 'test_table_1',
        columns: { id: { type: 'smallint', nullable: false, default: 'auto-increment' } }
    } as const;
    const table2 = {
        schema: 'public',
        title: 'test_table_2',
        columns: { id: { type: 'smallint', nullable: false, default: false } }
    } as const;
    const query = jest.fn();
    query.mockReturnValueOnce(Promise.resolve());
    query.mockReturnValueOnce(Promise.reject('mocked db'));
    query.mockReturnValueOnce(Promise.resolve());
    const createResult = await createTables({ query } as any, [table1, table2], false);
    if (createResult.ok) {
        throw 'it should not reach here';
    }
    expect(createResult.error).toStrictEqual({ db: 'mocked db', query: createTableSQL(table1) });
    expect(query.mock.calls.length).toBe(2);
    expect(query.mock.calls[0][0]).toBe(createSequencesSQL(table1)[0]);
    expect(query.mock.calls[1][0]).toBe(createTableSQL(table1));
});

test('db-fail and sequence-fail', async () => {
    const table1 = {
        schema: 'public',
        title: 'test_table_1',
        columns: { id: { type: 'smallint', nullable: false, default: 'auto-increment' } }
    } as const;
    const table2 = {
        schema: 'public',
        title: 'test_table_2',
        columns: { id: { type: 'smallint', nullable: false, default: false } }
    } as const;
    const query = jest.fn();
    query.mockReturnValueOnce(Promise.reject('mocked db'));
    query.mockReturnValueOnce(Promise.resolve());
    query.mockReturnValueOnce(Promise.resolve());
    const createResult = await createTables({ query } as any, [table2, table1], false);
    if (createResult.ok) {
        throw 'it should not reach here';
    }
    expect(createResult.error).toStrictEqual({ db: 'mocked db', query: createSequencesSQL(table1)[0] });
    expect(query.mock.calls.length).toBe(1);
    expect(query.mock.calls[0][0]).toBe(createSequencesSQL(table1)[0]);
});
