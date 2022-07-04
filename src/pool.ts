import {Pool as PgPool, Query} from 'pg';
import {toTransactionMode} from './dictionary';
import type {AddHook, OnSendQueryHook, Pool, RemoveHook} from './types/pool';

const submit = Query.prototype.submit;
Query.prototype.submit = function (this: any) {
    onSendQueryHooks.forEach(hook => hook(this.text, this.values));
    submit.apply(this, arguments as any);
};

const onSendQueryHooks: OnSendQueryHook[] = [];
const addHook: AddHook = ({event, hook}) => {
    switch (event) {
        case 'on-send-query':
            onSendQueryHooks.push(hook);
            break;
    }
};
const removeHook: RemoveHook = ({event, hook}) => {
    switch (event) {
        case 'on-send-query':
            onSendQueryHooks.splice(onSendQueryHooks.indexOf(hook), 1);
            break;
    }
};

const createPool = (connectionString: string): Pool => {
    const pool = new PgPool({connectionString});
    return {
        $: pool,
        transaction: (callback, isolationLevel = 'serializable', readOnly = false) => pool.connect().then(client =>
            client.query(`BEGIN TRANSACTION ISOLATION LEVEL ${toTransactionMode(isolationLevel, readOnly)} ;`)
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

export {createPool, addHook, removeHook};
