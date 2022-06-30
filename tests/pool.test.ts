import {createPool} from '../src/pool';
import {toTransactionIsolationLevel} from '../src/dictionary';
import {err, ok} from "never-catch";

let setting = {
    passConnect: false,
    passBeginTransaction: false,
    passCommit: false,
    passRollback: false
};

jest.mock('pg', () => {
    class MockedPool {
        name: string;
        setting: typeof setting;
        queryFn: jest.Mock<Promise<void>, [string]>;
        releaseFn: jest.Mock;

        constructor(_: string) {
            this.name = 'i am mocked pool.';
            this.setting = {...setting};
            this.queryFn = jest.fn((query: string) => {
                switch (query) {
                    case 'BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED ;':
                    case 'BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED ;':
                    case 'BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ ;':
                    case 'BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE ;':
                        if (this.setting.passBeginTransaction) {
                            return Promise.resolve();
                        } else {
                            return Promise.reject('begin transaction failed!');
                        }
                    case 'COMMIT ;':
                        if (this.setting.passCommit) {
                            return Promise.resolve();
                        } else {
                            return Promise.reject('commit failed!');
                        }
                    case 'ROLLBACK ;':
                        if (this.setting.passRollback) {
                            return Promise.resolve();
                        } else {
                            return Promise.reject('rollback failed!');
                        }
                    default:
                        return Promise.reject('unexpected query!');
                }
            })
            this.releaseFn = jest.fn();
        }

        connect() {
            if (this.setting.passConnect) {
                return Promise.resolve({
                    name: 'i am mocked client.',
                    query: this.queryFn,
                    release: this.releaseFn
                });
            } else {
                return Promise.reject('connect failed!');
            }
        }
    }

    const originalModule = jest.requireActual('pg');
    return {
        __esModule: true,
        ...originalModule,
        Pool: MockedPool
    }
});

test('connect-fail', async () => {
    setting = {
        passConnect: false,
        passBeginTransaction: true,
        passCommit: true,
        passRollback: true
    };
    const pool = createPool('hello db. it is me!');
    const callback = jest.fn();

    await expect(pool.transaction(callback, 'repeatable-read')).rejects.toBe('connect failed!');
    expect(callback.mock.calls.length).toBe(0);
    // @ts-ignore
    expect(pool.$.name).toBe('i am mocked pool.');
    expect((pool.$ as any).releaseFn.mock.calls.length).toBe(0);
    expect((pool.$ as any).queryFn.mock.calls.length).toBe(0);
});

test('begin-transaction-fail', async () => {
    setting = {
        passConnect: true,
        passBeginTransaction: false,
        passCommit: true,
        passRollback: true
    };
    const pool = createPool('hello db. it is me!');
    const callback = jest.fn();

    await expect(pool.transaction(callback, 'repeatable-read')).rejects.toBe('begin transaction failed!');
    expect(callback.mock.calls.length).toBe(0);
    // @ts-ignore
    expect(pool.$.name).toBe('i am mocked pool.');
    expect((pool.$ as any).releaseFn.mock.calls.length).toBe(1);
    expect((pool.$ as any).queryFn.mock.calls.length).toBe(2);
    expect((pool.$ as any).queryFn.mock.calls[0][0]).toBe(`BEGIN TRANSACTION ISOLATION LEVEL ${toTransactionIsolationLevel('repeatable-read')} ;`);
    expect((pool.$ as any).queryFn.mock.calls[1][0]).toBe('ROLLBACK ;');
});

test('callback-ok and commit-fail', async () => {
    setting = {
        passConnect: true,
        passBeginTransaction: true,
        passCommit: false,
        passRollback: true
    };
    const pool = createPool('hello db. it is me!');
    const callback = jest.fn().mockReturnValueOnce(ok(12));

    await expect(pool.transaction(callback, 'repeatable-read')).rejects.toBe('commit failed!');
    expect(callback.mock.calls.length).toBe(1);
    expect(callback.mock.calls[0][0].name).toBe('i am mocked client.');
    // @ts-ignore
    expect(pool.$.name).toBe('i am mocked pool.');
    expect((pool.$ as any).releaseFn.mock.calls.length).toBe(1);
    expect((pool.$ as any).queryFn.mock.calls.length).toBe(3);
    expect((pool.$ as any).queryFn.mock.calls[0][0]).toBe(`BEGIN TRANSACTION ISOLATION LEVEL ${toTransactionIsolationLevel('repeatable-read')} ;`);
    expect((pool.$ as any).queryFn.mock.calls[1][0]).toBe('COMMIT ;');
    expect((pool.$ as any).queryFn.mock.calls[2][0]).toBe('ROLLBACK ;');
});

test('callback-ok and commit-ok', async () => {
    setting = {
        passConnect: true,
        passBeginTransaction: true,
        passCommit: true,
        passRollback: true
    };
    const pool = createPool('hello db. it is me!');
    const callback = jest.fn().mockReturnValueOnce(ok(12));

    await expect(pool.transaction(callback, 'repeatable-read')).resolves.toStrictEqual(ok(12));
    expect(callback.mock.calls.length).toBe(1);
    expect(callback.mock.calls[0][0].name).toBe('i am mocked client.');
    // @ts-ignore
    expect(pool.$.name).toBe('i am mocked pool.');
    expect((pool.$ as any).releaseFn.mock.calls.length).toBe(1);
    expect((pool.$ as any).queryFn.mock.calls.length).toBe(2);
    expect((pool.$ as any).queryFn.mock.calls[0][0]).toBe(`BEGIN TRANSACTION ISOLATION LEVEL ${toTransactionIsolationLevel('repeatable-read')} ;`);
    expect((pool.$ as any).queryFn.mock.calls[1][0]).toBe('COMMIT ;');
});

test('callback-fail and rollback-fail', async () => {
    setting = {
        passConnect: true,
        passBeginTransaction: true,
        passCommit: true,
        passRollback: false
    };
    const pool = createPool('hello db. it is me!');
    const callback = jest.fn().mockReturnValueOnce(err(10));

    await expect(pool.transaction(callback, 'repeatable-read')).rejects.toBe('rollback failed!');
    expect(callback.mock.calls.length).toBe(1);
    expect(callback.mock.calls[0][0].name).toBe('i am mocked client.');
    // @ts-ignore
    expect(pool.$.name).toBe('i am mocked pool.');
    expect((pool.$ as any).releaseFn.mock.calls.length).toBe(1);
    expect((pool.$ as any).queryFn.mock.calls.length).toBe(3);
    expect((pool.$ as any).queryFn.mock.calls[0][0]).toBe(`BEGIN TRANSACTION ISOLATION LEVEL ${toTransactionIsolationLevel('repeatable-read')} ;`);
    expect((pool.$ as any).queryFn.mock.calls[1][0]).toBe('ROLLBACK ;');
    expect((pool.$ as any).queryFn.mock.calls[2][0]).toBe('ROLLBACK ;');
});

test('callback-fail and rollback-ok', async () => {
    setting = {
        passConnect: true,
        passBeginTransaction: true,
        passCommit: true,
        passRollback: true
    };
    const pool = createPool('hello db. it is me!');
    const callback = jest.fn().mockReturnValueOnce(err(10));

    await expect(pool.transaction(callback, 'repeatable-read')).resolves.toStrictEqual(err(10));
    expect(callback.mock.calls.length).toBe(1);
    expect(callback.mock.calls[0][0].name).toBe('i am mocked client.');
    // @ts-ignore
    expect(pool.$.name).toBe('i am mocked pool.');
    expect((pool.$ as any).releaseFn.mock.calls.length).toBe(1);
    expect((pool.$ as any).queryFn.mock.calls.length).toBe(2);
    expect((pool.$ as any).queryFn.mock.calls[0][0]).toBe(`BEGIN TRANSACTION ISOLATION LEVEL ${toTransactionIsolationLevel('repeatable-read')} ;`);
    expect((pool.$ as any).queryFn.mock.calls[1][0]).toBe('ROLLBACK ;');
});
