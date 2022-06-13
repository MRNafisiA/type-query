import {Client} from 'pg';
import {Pool} from './types/pool';
import PostgresErrors from './error';
import {addHook, createPool} from './pool';
import {err, ok, Result} from 'never-catch';

type UserID = number;

let testDBInfo: { connectionUrl: string, name: string | undefined };
let db: { state: 'uninitialized'; }
    | { state: 'constructing'; }
    | { state: 'ready'; pool: Pool; dbName: string; userIDs: UserID[]; }
    | { state: 'destructing'; } = {state: 'uninitialized'};
let usersIndex = 0;
let keepDb = false;

const setTestDBInfo = (connectionUrl: string, name?: string) => {
    testDBInfo = {connectionUrl, name};
    keepDb = evalKeepDb();
    addHook({
        event: 'on-send-query',
        hook: (query, params) => {
            console.log('\x1b[36m' + `Query: ${query}`);
            console.log(`Parameters: ${JSON.stringify(params)}` + '\x1b[0m' + '\n');
        }
    });
};

const getTestPool = async (): Promise<Result<{ id: UserID, pool: Pool }, any>> => {
    if (testDBInfo === undefined) {
        throw 'test db info did not set!';
    }
    if (db.state === 'uninitialized') {
        db = {state: 'constructing'};
        const constructResult = await constructTestPool();
        if (!constructResult.ok) {
            return constructResult;
        }
        db = {...constructResult.value, state: 'ready', userIDs: []};
    }
    if (db.state === 'ready') {
        db.userIDs.push(++usersIndex);
        return ok({id: usersIndex, pool: db.pool});
    }
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(getTestPool());
        }, 3000);
    });
};

const releaseTestPool = async (id: number, rollback: boolean = true) => {
    if (testDBInfo === undefined) {
        throw 'test db info did not set!';
    }
    if (db.state !== 'ready') {
        throw 'db is not ready!'
    }
    if (!rollback) {
        keepDb = true;
    }
    db.userIDs.splice(db.userIDs.indexOf(id), 1);
    if (db.userIDs.length !== 0) {
        return;
    }
    await (new Promise((resolve, reject) => {
        if (!(db.state === 'ready' && db.userIDs.length === 0)) {
            resolve(undefined);
            return;
        }
        setTimeout(async () => {
            if (db.state === 'ready' && db.userIDs.length === 0) {
                const dbName = db.dbName;
                const pool = db.pool;
                db = {state: 'destructing'};
                await pool.$.end();
                if (!keepDb) {
                    const destructingSucceed = await dropDb(dbName);
                    if (!destructingSucceed.ok) {
                        reject(destructingSucceed.error);
                        return;
                    }
                }
                db = {state: 'uninitialized'};
                keepDb = evalKeepDb();
            }
            resolve(undefined);
        }, 5000);
    }));
};

const constructTestPool = async (): Promise<Result<{ pool: Pool; dbName: string; }, unknown>> => {
    let dbName: string;
    if (testDBInfo.name === undefined) {
        const tempClient = new Client({
            connectionString: testDBInfo.connectionUrl
        });
        await tempClient.connect();
        const createDbResult = await createRandomNameDb(tempClient);
        await tempClient.end();
        if (!createDbResult.ok) {
            return createDbResult;
        }
        dbName = createDbResult.value;
    } else {
        dbName = testDBInfo.name
    }

    const pool = createPool(testDBInfo.connectionUrl + '/' + dbName);

    return ok({pool, dbName});
};

const createRandomNameDb = async (client: Client): Promise<Result<string, unknown>> => {
    const dbName = 'test_db_' + new Date().toISOString().replace('T', '_').replaceAll(':', '-').substring(0, 19);
    const result = await client.query(`CREATE DATABASE ${dbName};`)
        .then(() => ok(dbName))
        .catch(error => err(error));
    if (!result.ok) {
        switch (result.error.code) {
            case PostgresErrors.DATABASE_ALREADY_EXISTS:
                return createRandomNameDb(client);
            default:
                return result;
        }
    }
    return result;
};

const dropDb = async (dbName: string): Promise<Result<undefined, unknown>> => {
    const tempClient = new Client({
        connectionString: testDBInfo.connectionUrl
    });
    await tempClient.connect();
    const result = await tempClient.query(`DROP DATABASE ${dbName};`).then(() => ok(undefined)).catch(error => err(error));
    await tempClient.end();
    return result;
};

function evalKeepDb(): boolean {
    return testDBInfo.name !== undefined;
}

export {
    setTestDBInfo,
    getTestPool,
    releaseTestPool
};