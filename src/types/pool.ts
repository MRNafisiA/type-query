import {Param} from './entity';
import type {Pool as PgPool, PoolClient} from 'pg';

type TransactionIsolationLevel = 'read-uncommitted' | 'read-committed' | 'repeatable-read' | 'serializable';

type Pool = {
    $: PgPool;
    transaction: (
        callback: (client: PoolClient) => Promise<boolean>,
        isolationLevel?: TransactionIsolationLevel
    ) => Promise<void>;
};

type OnSendQueryHook = (query: string, params: Param[]) => void;
type AddHook = (hookAndEvent: { event: 'on-send-query', hook: OnSendQueryHook }) => void;
type RemoveHook = (hookAndEvent: { event: 'on-send-query', hook: OnSendQueryHook }) => void;

export type {
    TransactionIsolationLevel,
    Pool,
    OnSendQueryHook,
    AddHook,
    RemoveHook
};
