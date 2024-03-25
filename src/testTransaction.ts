import { Pool, PoolClient } from 'pg';
import { err, ok } from 'never-catch';
import { NullableType, Schema, Table } from './Table';
import { createEntity, NullableAndDefaultColumns } from './entity';
import { transaction, TransactionIsolationLevel } from './transaction';
import { generateCreateSequencesSQL, generateCreateTableSQL } from './ddl';

type TestTableData<S extends Schema = Schema> = {
    table: Table<S>;
    startData: ({
        [key in Exclude<
            keyof S,
            keyof NullableAndDefaultColumns<S>
        >]: NullableType<S[key]['type'], S[key]['nullable']>;
    } & {
        [key in keyof NullableAndDefaultColumns<S>]?: NullableType<
            S[key]['type'],
            S[key]['nullable']
        >;
    })[];
    finalData: {
        [key in keyof S]: NullableType<S[key]['type'], S[key]['nullable']>;
    }[];
};

const isEqual = (a: unknown, b: unknown): boolean => {
    if (a === b) {
        return true;
    }
    if (
        typeof a === 'object' &&
        a !== null &&
        typeof b === 'object' &&
        b !== null
    ) {
        return (
            Array.isArray(a) === Array.isArray(b) &&
            Object.entries(a).every(([key, value]) =>
                isEqual(value, b[key as keyof typeof b])
            ) &&
            Object.entries(b).every(([key, value]) =>
                isEqual(value, a[key as keyof typeof a])
            )
        );
    }
    return false;
};

const testTransaction = async (
    tablesWithData: TestTableData[],
    callback: (client: PoolClient) => Promise<void>,
    pool: Pool,
    isolationLevel = 'read-committed' as TransactionIsolationLevel,
    rollback = true
): Promise<void> =>
    transaction(
        pool,
        async client => {
            // create tables
            await client.query(
                tablesWithData
                    .map(({ table }) => [
                        ...generateCreateSequencesSQL(table),
                        generateCreateTableSQL(table)
                    ])
                    .flat()
                    .join('; ') + ';'
            );

            // init db
            for (const tableWithData of tablesWithData) {
                if (tableWithData.startData.length !== 0) {
                    const insertResult = await createEntity(tableWithData.table)
                        .insert(
                            tableWithData.startData,
                            [{ expression: true, name: 'confirm' }] as const,
                            {
                                nullableDefaultColumns: Object.entries(
                                    tableWithData.table.columns
                                )
                                    .filter(
                                        ([, column]) =>
                                            column.nullable || column.default
                                    )
                                    .map(([key]) => key)
                            }
                        )
                        .execute(client, [
                            'count',
                            tableWithData.startData.length
                        ]);
                    if (!insertResult.ok) {
                        return err([JSON.stringify(insertResult.error)]);
                    }
                }
            }

            // callback
            await callback(client);

            // check db
            const differences: string[] = [];
            for (const { table, finalData } of tablesWithData) {
                const selectResult = await createEntity(table)
                    .select(Object.keys(table.columns), true)
                    .execute(client, []);
                if (!selectResult.ok) {
                    return err([JSON.stringify(selectResult.error)]);
                }

                for (const finalRow of finalData) {
                    const i = selectResult.value.findIndex(v =>
                        isEqual(v, finalRow)
                    );
                    if (i === -1) {
                        differences.push(
                            '\nfinal row not found:\n' +
                                JSON.stringify(finalRow, null, 4)
                        );
                    } else {
                        selectResult.value.splice(i, 1);
                    }
                }

                differences.push(
                    ...selectResult.value.map(
                        v =>
                            '\ndb row without match:\n' +
                            JSON.stringify(v, null, 4)
                    )
                );
            }
            if (differences.length !== 0) {
                return err(differences);
            }

            if (rollback) {
                return err(undefined);
            } else {
                return ok(undefined);
            }
        },
        isolationLevel
    ).then(result => {
        if (!result.ok && result.error !== undefined) {
            throw result.error.join('\n');
        }
    });

export { type TestTableData, isEqual, testTransaction };
