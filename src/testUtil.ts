import {isEqual} from 'lodash';
import {createEntity} from './entity';
import {Err, err, ok} from 'never-catch';
import {createTables, resolveTablesDependency} from './schema';
import {CreateTestTableData, TestTransaction} from './types/testUtil';

const testTransaction: TestTransaction = async (
    tablesWithData,
    callback,
    pool,
    isolationLevel = 'read-committed',
    rollback = true
) => {
    let error: Err<any> | undefined;
    await pool.transaction(async client => {
        // create tables
        const createTableResult = await createTables(
            client,
            tablesWithData.map(v => v.table)
        );
        if (!createTableResult.ok) {
            error = createTableResult;
            return err(undefined);
        }

        // resolve tables
        const resolvedTablesResult = resolveTablesDependency(tablesWithData.map(v => v.table));
        if (!resolvedTablesResult.ok) {
            error = resolvedTablesResult;
            return err(undefined);
        }
        const sortedTablesWithData = tablesWithData.sort(
            (a, b) => resolvedTablesResult.value.indexOf(a.table) - resolvedTablesResult.value.indexOf(b.table)
        );

        // init db
        for (const tableWithData of sortedTablesWithData) {
            if (tableWithData.startData.length !== 0) {
                const insertResult = await createEntity(tableWithData.table)
                    .insert(tableWithData.startData, [{exp: true, as: 'confirm'}], {
                        nullableDefaultColumns: Object.entries(tableWithData.table.columns)
                            .filter(([_, value]) => (value as any).nullable || (value as any).default !== false)
                            .map(([key, _]) => key)
                    })
                    .exec(client, ['count', tableWithData.startData.length]);
                if (!insertResult.ok) {
                    error = insertResult;
                    return err(undefined);
                }
            }
        }

        // callback
        await callback(client).catch(e => {
            error = e;
        });

        // check db
        const differences: any[] = [];
        for (const {table, finalData, skipIt, lengthCheck} of sortedTablesWithData) {
            const primaryKeys = Object.entries(table.columns)
                .filter(([_, value]) => !(value as any).nullable && (value as any).primary)
                .map(([key, _]) => key);
            const selectResult = await createEntity(table).select(Object.keys(table.columns), true).exec(client, []);
            if (!selectResult.ok) {
                error = selectResult;
                return err(undefined);
            }

            if (typeof finalData === 'function') {
                const result = await finalData(selectResult.value);
                if (!result.ok) {
                    differences.push(result.error);
                }
                continue;
            }

            const usage = new Array(finalData.length).fill(0);
            for (const dbRow of selectResult.value) {
                let found = false;
                const tempDifferences: typeof differences = [];
                const candidateFinalData = finalData.filter(({row: finalRow}) => {
                    for (const primaryKey of primaryKeys) {
                        if (!isEqual(finalRow[primaryKey], dbRow[primaryKey])) {
                            return false;
                        }
                    }
                    return true;
                });
                for (let i = 0; i < candidateFinalData.length; i++) {
                    found = true;
                    const {row: finalRow} = candidateFinalData[i];
                    for (const key in dbRow) {
                        const value = finalRow[key];
                        if (typeof value === 'function') {
                            const result = await value(dbRow[key], dbRow, selectResult.value);
                            if (!result.ok) {
                                tempDifferences.push({
                                    dbRow,
                                    finalRow,
                                    key,
                                    message: `match function rejected (${JSON.stringify(dbRow[key])})`
                                });
                                found = false;
                            }
                        } else {
                            if (!isEqual(dbRow[key], value)) {
                                tempDifferences.push({
                                    dbRow,
                                    finalRow,
                                    key,
                                    message: `expected(${JSON.stringify(value)}) received(${JSON.stringify(
                                        dbRow[key]
                                    )})`
                                });
                                found = false;
                            }
                        }
                    }
                    if (found) {
                        usage[finalData.indexOf(candidateFinalData[i])]++;
                        break;
                    }
                }

                if (!found && skipIt !== undefined) {
                    const customCheckResult = await skipIt(dbRow);
                    if (customCheckResult.ok) {
                        found = true;
                    }
                }
                if (!found) {
                    if (tempDifferences.length === 0) {
                        tempDifferences.push(`following row was not found ${JSON.stringify(dbRow)}`);
                    }
                    differences.push(...tempDifferences);
                }
            }

            for (let i = 0; i < finalData.length; i++) {
                const [mode, number] = finalData[i].useTime ?? ['equal', 1];
                if (number === -1) {
                    continue;
                }
                switch (mode) {
                    case 'equal':
                        if (number !== usage[i]) {
                            differences.push({
                                finalRow: finalData[i].row,
                                index: i,
                                message: `expect this final row to be used ${number} times, but It got used ${usage[i]} times`
                            });
                        }
                        break;
                    case 'lessThanEqual':
                        if (number < usage[i]) {
                            differences.push({
                                finalRow: finalData[i].row,
                                index: i,
                                message: `expect this final row to be used less than ${number} times, but It got used ${usage[i]} times`
                            });
                        }
                        break;
                    case 'moreThanEqual':
                        if (number > usage[i]) {
                            differences.push({
                                finalRow: finalData[i].row,
                                index: i,
                                message: `expect this final row to be more than ${number} times, but It got used ${usage[i]} times`
                            });
                        }
                        break;
                }
            }

            if (lengthCheck !== undefined) {
                if (typeof lengthCheck === 'function') {
                    const result = await lengthCheck(selectResult.value);
                    if (!result.ok) {
                        differences.push(`length check failed ${result.error}`);
                    }
                } else {
                    if (selectResult.value.length !== lengthCheck) {
                        differences.push(
                            `length check failed expected(${lengthCheck}) received(${selectResult.value.length})`
                        );
                    }
                }
            }
        }
        if (differences.length !== 0) {
            error = err(differences);
        }

        if (rollback) {
            return err(undefined);
        } else {
            return ok(undefined);
        }
    }, isolationLevel);
    if (error === undefined) {
        return undefined;
    } else {
        if (Object.keys(error).length === 2 && 'ok' in error && 'error' in error) {
            throw JSON.stringify(error, null, 4);
        } else {
            throw error;
        }
    }
};

const createTestTableData: CreateTestTableData = (table, startData, finalData, skipIt, lengthCheck) => ({
    table,
    startData,
    finalData,
    skipIt,
    lengthCheck
});

export {testTransaction, createTestTableData};
