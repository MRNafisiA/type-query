import {Param} from './entity';
import type {Pool as PgPool, PoolClient} from 'pg';
import {Result} from "never-catch";

type TransactionIsolationLevel = 'read-uncommitted' | 'read-committed' | 'repeatable-read' | 'serializable';

type Pool = {
    $: PgPool;
    transaction: <R extends Result<unknown, unknown>> (
        callback: (client: PoolClient) => Promise<R>,
        isolationLevel?: TransactionIsolationLevel
    ) => Promise<R>;
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
