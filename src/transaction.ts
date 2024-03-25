import { Pool, PoolClient } from 'pg';
import { Result } from 'never-catch';
import { Dictionary } from './keywords';

type TransactionIsolationLevel =
    | 'read-uncommitted'
    | 'read-committed'
    | 'repeatable-read'
    | 'serializable';

const transaction = async <R extends Result<unknown, unknown>>(
    pool: Pool,
    callback: (client: PoolClient) => Promise<R>,
    isolationLevel = 'serializable' as TransactionIsolationLevel,
    readOnly = false
) =>
    pool.connect().then(client =>
        client
            .query(
                `BEGIN TRANSACTION ISOLATION LEVEL ${Dictionary.TransactionIsolationLevel[isolationLevel]} READ ${readOnly ? 'ONLY' : 'WRITE'};`
            )
            .then(async () => {
                const result = await callback(client);
                if (result.ok) {
                    await client.query('COMMIT;');
                } else {
                    await client.query('ROLLBACK;');
                }
                client.release();
                return result;
            })
            .catch(async err => {
                try {
                    await client.query('ROLLBACK;');
                } catch (_) {
                    /* empty */
                }
                client.release();
                throw err;
            })
    );

export { type TransactionIsolationLevel, transaction };
