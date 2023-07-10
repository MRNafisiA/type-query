import { Result } from 'never-catch';
import { toTransactionMode } from './dictionary';
import { Pool as PgPool, PoolClient, PoolConfig } from 'pg';

type TransactionIsolationLevel = 'read-uncommitted' | 'read-committed' | 'repeatable-read' | 'serializable';
type Pool = {
    $: PgPool;
    transaction: <R extends Result<unknown, unknown>>(
        callback: (client: PoolClient) => Promise<R>,
        isolationLevel?: TransactionIsolationLevel,
        readOnly?: boolean
    ) => Promise<R>;
};

const createPool = (config: PoolConfig): Pool => {
    const pool = new PgPool(config);
    return {
        $: pool,
        transaction: (callback, isolationLevel = 'serializable', readOnly = false) =>
            pool.connect().then(client =>
                client
                    .query(`BEGIN TRANSACTION ISOLATION LEVEL ${toTransactionMode(isolationLevel, readOnly)} ;`)
                    .then(async () => {
                        const result = await callback(client);
                        if (result.ok) {
                            await client.query('COMMIT ;');
                        } else {
                            await client.query('ROLLBACK ;');
                        }
                        client.release();
                        return result;
                    })
                    .catch(async err => {
                        try {
                            await client.query('ROLLBACK ;');
                        } catch (_) {}
                        client.release();
                        throw err;
                    })
            )
    } as const;
};

export type { TransactionIsolationLevel, Pool };
export { createPool };
