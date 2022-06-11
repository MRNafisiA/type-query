import type {Result} from 'never-catch';
import type {Pool as PgPool, PoolClient} from 'pg';

type TransactionIsolationLevel = 'read-uncommitted' | 'read-committed' | 'repeatable-read' | 'serializable';

type Pool = {
    $: PgPool;
    transaction: (
        callback: (client: PoolClient) => Promise<Result<any, any>>,
        isolationLevel?: TransactionIsolationLevel
    ) => Promise<void>;
};

export type {
    TransactionIsolationLevel,
    Pool
};