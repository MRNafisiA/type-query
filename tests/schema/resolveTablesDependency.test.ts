import {resolveTablesDependency} from '../../src/schema';

test('1-level-2', () => {
    const level1Table = {
        schema: 'public',
        title: 'level_1_table',
        columns: {
            id: {
                type: 'smallint',
                nullable: false,
                default: false
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
                default: false
            }
        }
    } as const;
    const resolveTablesDependencyResult = resolveTablesDependency([level1Table, level1Table2]);
    if (!resolveTablesDependencyResult.ok) {
        throw 'it should not reach here';
    }
    expect(resolveTablesDependencyResult.value).toStrictEqual([level1Table, level1Table2]);
});

test('2-level-2', () => {
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
                reference: {table: level2Table, column: 'id'}
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
                reference: {table: level2Table, column: 'id'}
            }
        }
    } as const;
    const resolveTablesDependencyResult = resolveTablesDependency([level1Table, level1Table2]);
    if (!resolveTablesDependencyResult.ok) {
        throw 'it should not reach here';
    }
    expect(resolveTablesDependencyResult.value).toStrictEqual([level2Table, level1Table, level1Table2]);
});

test('3-level', () => {
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
                reference: {table: level3Table, column: 'id'}
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
                reference: {table: level2Table, column: 'id'}
            }
        }
    } as const;
    const resolveTablesDependencyResult = resolveTablesDependency([level1Table]);
    if (!resolveTablesDependencyResult.ok) {
        throw 'it should not reach here';
    }
    expect(resolveTablesDependencyResult.value).toStrictEqual([level3Table, level2Table, level1Table]);
});
