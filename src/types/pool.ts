import { Param } from './entity';
import { Result } from 'never-catch';
import type { Pool as PgPool, PoolClient } from 'pg';

type TransactionIsolationLevel = 'read-uncommitted' | 'read-committed' | 'repeatable-read' | 'serializable';

type Pool = {
    $: PgPool;
    transaction: <R extends Result<unknown, unknown>>(
        callback: (client: PoolClient) => Promise<R>,
        isolationLevel?: TransactionIsolationLevel,
        readOnly?: boolean
    ) => Promise<R>;
};

type OnSendQueryHook = (query: string, params: Param[]) => void;
type AddHook = (hookAndEvent: { event: 'on-send-query'; hook: OnSendQueryHook }) => void;
type RemoveHook = (hookAndEvent: { event: 'on-send-query'; hook: OnSendQueryHook }) => void;

export type { TransactionIsolationLevel, Pool, OnSendQueryHook, AddHook, RemoveHook };
