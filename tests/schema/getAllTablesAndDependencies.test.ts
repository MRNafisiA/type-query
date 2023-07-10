import Table from '../../src/types/Table';
import { getAllTablesAndDependencies } from '../../src/schema';

test('empty', () => {
    const allTablesAndDependenciesResult = getAllTablesAndDependencies([]);
    if (!allTablesAndDependenciesResult.ok) {
        throw 'it should not reach here';
    }
    const [allTables, dependencies] = allTablesAndDependenciesResult.value;
    expect(allTables).toStrictEqual([]);
    expect(dependencies).toStrictEqual([]);
});

test('no-reference', () => {
    const table = {
        schema: 'public',
        title: 'test_table',
        columns: {
            id: {
                type: 'smallint',
                nullable: false,
                default: false
            }
        }
    } as const;
    const allTablesAndDependenciesResult = getAllTablesAndDependencies([table]);
    if (!allTablesAndDependenciesResult.ok) {
        throw 'it should not reach here';
    }
    const [allTables, dependencies] = allTablesAndDependenciesResult.value;
    expect(allTables).toStrictEqual([table]);
    expect(dependencies).toStrictEqual([]);
});

test('reference-no-bidirectional-2-level', () => {
    const level2Table = {
        schema: 'public',
        title: 'level_2_table',
        columns: {
            id: {
                type: 'smallint',
                nullable: false,
                default: false
            }
        }
    } as const;
    const level1Table = {
        schema: 'public',
        title: 'level_1_table',
        columns: {
            id: {
                type: 'smallint',
                nullable: false,
                default: false,
                reference: { table: level2Table, column: 'id' }
            }
        }
    } as const;
    const allTablesAndDependenciesResult = getAllTablesAndDependencies([level1Table]);
    if (!allTablesAndDependenciesResult.ok) {
        throw 'it should not reach here';
    }
    const [allTables, dependencies] = allTablesAndDependenciesResult.value;
    expect(allTables).toStrictEqual([level1Table, level2Table]);
    expect(dependencies).toStrictEqual([{ parent: level1Table, child: level2Table }]);
});

test('reference-no-bidirectional-2-level-2', () => {
    const level2Table = {
        schema: 'public',
        title: 'level_2_table',
        columns: {
            id: {
                type: 'smallint',
                nullable: false,
                default: false
            }
        }
    } as const;
    const level1Table = {
        schema: 'public',
        title: 'level_1_table',
        columns: {
            id: {
                type: 'smallint',
                nullable: false,
                default: false,
                reference: { table: level2Table, column: 'id' }
            }
        }
    } as const;
    const level1Table2 = {
        schema: 'public',
        title: 'level_1_table_2',
        columns: {
            id: {
                type: 'smallint',
                nullable: false,
                default: false,
                reference: { table: level2Table, column: 'id' }
            }
        }
    } as const;
    const allTablesAndDependenciesResult = getAllTablesAndDependencies([level1Table, level1Table2]);
    if (!allTablesAndDependenciesResult.ok) {
        throw 'it should not reach here';
    }
    const [allTables, dependencies] = allTablesAndDependenciesResult.value;
    expect(allTables).toStrictEqual([level1Table, level1Table2, level2Table]);
    expect(dependencies).toStrictEqual([
        { parent: level1Table, child: level2Table },
        { parent: level1Table2, child: level2Table }
    ]);
});

test('reference-no-bidirectional-3-level', () => {
    const level3Table = {
        schema: 'public',
        title: 'level_3_table',
        columns: {
            id: {
                type: 'smallint',
                nullable: false,
                default: false
            }
        }
    } as const;
    const level2Table = {
        schema: 'public',
        title: 'level_2_table',
        columns: {
            id: {
                type: 'smallint',
                nullable: false,
                default: false,
                reference: { table: level3Table, column: 'id' }
            }
        }
    } as const;
    const level1Table = {
        schema: 'public',
        title: 'level_1_table',
        columns: {
            id: {
                type: 'smallint',
                nullable: false,
                default: false,
                reference: { table: level2Table, column: 'id' }
            }
        }
    } as const;
    const allTablesAndDependenciesResult = getAllTablesAndDependencies([level1Table]);
    if (!allTablesAndDependenciesResult.ok) {
        throw 'it should not reach here';
    }
    const [allTables, dependencies] = allTablesAndDependenciesResult.value;
    expect(allTables).toStrictEqual([level1Table, level2Table, level3Table]);
    expect(dependencies).toStrictEqual([
        { parent: level1Table, child: level2Table },
        { parent: level2Table, child: level3Table }
    ]);
});

test('reference-bidirectional', () => {
    const level2Table = {
        schema: 'public',
        title: 'level_2_table',
        columns: {
            id: {
                type: 'smallint',
                nullable: false,
                default: false,
                reference: { table: {} as Table, column: 'd' }
            }
        }
    } as const;
    const level1Table = {
        schema: 'public',
        title: 'level_1_table',
        columns: {
            id: {
                type: 'smallint',
                nullable: false,
                default: false,
                reference: { table: level2Table, column: 'id' }
            }
        }
    } as const;
    // @ts-ignore
    level2Table.columns.id.reference.table = level1Table;
    // @ts-ignore
    level2Table.columns.id.reference.column = 'id';
    const allTablesAndDependenciesResult = getAllTablesAndDependencies([level1Table]);
    if (allTablesAndDependenciesResult.ok) {
        throw 'it should not reach here';
    }
    expect(allTablesAndDependenciesResult.error).toContain('bidirectional dependency detected');
    expect(allTablesAndDependenciesResult.error).toContain('"public"."level_1_table"');
    expect(allTablesAndDependenciesResult.error).toContain('"public"."level_2_table"');
});
