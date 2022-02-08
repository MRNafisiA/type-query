import {Pool, PoolClient, Query} from 'pg';
import {Delete, Insert, InsertExpression, Select, Update, UpdateExpression} from './Query';

const submit = Query.prototype.submit;
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    Query.prototype.submit = function (this: any) {
        const text = this.text;
        const values = this.values;
        console.log('\x1b[36m' + `Query: ${text}`);
        console.log(`Parameters: ${values}` + '\x1b[0m');
        submit.apply(this, arguments as any);
    };
}

const entity = {Select, Insert, InsertExpression, Update, UpdateExpression, Delete} as const;
const getClient = (poolClient: PoolClient) => ({$: poolClient, ...entity});
const pool = {
    $: new Pool(),
    ...entity,
    transaction: async (
        callback: (client: Client) => void,
        isolationLevel: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE' = 'SERIALIZABLE'
    ) => pool.$.connect()
        .then(poolClient =>
            poolClient.query(`BEGIN TRANSACTION ISOLATION LEVEL ${isolationLevel}`)
                .then(() => callback(getClient(poolClient)))
                .then(async () => {
                    await poolClient.query('COMMIT');
                    await poolClient.release();
                })
                .catch(async (e) => {
                    await poolClient.query('ROLLBACK');
                    await poolClient.release();
                    throw e;
                })
        )
} as const;

type Client = ReturnType<typeof getClient>;

export default pool;
export {Client};
