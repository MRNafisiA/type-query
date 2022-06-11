import {Pool as PgPool} from 'pg';
import type {Pool} from './types/pool';
import {toTransactionIsolationLevel} from './dictionary';

const createPool = (connectionString: string): Pool => {
    const pool = new PgPool({connectionString});
    return {
        $: pool,
        transaction: (callback, isolationLevel = 'serializable') => pool.connect().then(client =>
            client.query(`BEGIN TRANSACTION ISOLATION LEVEL ${toTransactionIsolationLevel(isolationLevel)} ;`)
                .then(async () => {
                    const result = await callback(client);
                    if (result.ok) {
                        await client.query('COMMIT ;');
                    } else {
                        await client.query('ROLLBACK ;');
                    }
                    client.release();
                })
                .catch(async (err) => {
                    try {
                        await client.query('ROLLBACK ;');
                    } catch (_) {
                    }
                    client.release();
                    throw err;
                })
        )
    } as const;
};

export {Pool};
export default createPool;