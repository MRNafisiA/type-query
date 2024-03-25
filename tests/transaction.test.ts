import './__init__';
import { Pool } from 'pg';
import { err, ok } from 'never-catch';
import { transaction } from '../src/transaction';

describe('transaction', () => {
    test('connect reject', async () => {
        const mockPool = {
            connect: jest.fn().mockRejectedValueOnce('a')
        };
        const result = await transaction(
            mockPool as unknown as Pool,
            async () => ok(undefined)
        ).catch(v => v);

        expect(mockPool.connect.mock.calls).toStrictEqual([[]]);
        expect(result).toStrictEqual('a');
    });
    test('begin reject, rollback reject', async () => {
        const mockClient = {
            query: jest
                .fn()
                .mockRejectedValueOnce('a')
                .mockRejectedValueOnce('b'),
            release: jest.fn()
        };
        const mockPool = {
            connect: jest.fn().mockResolvedValueOnce(mockClient)
        };
        const mockCallback = jest.fn();
        const result = await transaction(
            mockPool as unknown as Pool,
            mockCallback,
            'serializable',
            false
        ).catch(v => v);

        expect(mockPool.connect.mock.calls).toStrictEqual([[]]);
        expect(mockClient.query.mock.calls).toStrictEqual([
            ['BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE READ WRITE;'],
            ['ROLLBACK;']
        ]);
        expect(mockClient.release.mock.calls).toStrictEqual([[]]);
        expect(mockCallback.mock.calls).toStrictEqual([]);
        expect(result).toStrictEqual('a');
    });
    test('begin reject, rollback return', async () => {
        const mockClient = {
            query: jest
                .fn()
                .mockRejectedValueOnce('a')
                .mockReturnValueOnce('b'),
            release: jest.fn()
        };
        const mockPool = {
            connect: jest.fn().mockResolvedValueOnce(mockClient)
        };
        const mockCallback = jest.fn();
        const result = await transaction(
            mockPool as unknown as Pool,
            mockCallback,
            'serializable',
            true
        ).catch(v => v);

        expect(mockClient.query.mock.calls).toStrictEqual([
            ['BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE READ ONLY;'],
            ['ROLLBACK;']
        ]);
        expect(mockClient.release.mock.calls).toStrictEqual([[]]);
        expect(mockCallback.mock.calls).toStrictEqual([]);
        expect(result).toStrictEqual('a');
    });
    test('begin return, callback ok', async () => {
        const mockClient = {
            query: jest.fn().mockResolvedValue('a').mockResolvedValue('b'),
            release: jest.fn()
        };
        const mockPool = {
            connect: jest.fn().mockResolvedValueOnce(mockClient)
        };
        const mockCallback = jest.fn().mockReturnValueOnce(ok('c'));
        const result = await transaction(
            mockPool as unknown as Pool,
            mockCallback,
            'serializable',
            true
        ).catch(v => v);

        expect(mockClient.query.mock.calls).toStrictEqual([
            ['BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE READ ONLY;'],
            ['COMMIT;']
        ]);
        expect(mockClient.release.mock.calls).toStrictEqual([[]]);
        expect(mockCallback.mock.calls).toStrictEqual([[mockClient]]);
        expect(result).toStrictEqual(ok('c'));
    });
    test('begin return, callback err', async () => {
        const mockClient = {
            query: jest.fn().mockResolvedValue('a').mockResolvedValue('b'),
            release: jest.fn()
        };
        const mockPool = {
            connect: jest.fn().mockResolvedValueOnce(mockClient)
        };
        const mockCallback = jest.fn().mockReturnValueOnce(err('c'));
        const result = await transaction(
            mockPool as unknown as Pool,
            mockCallback,
            'serializable',
            true
        ).catch(v => v);

        expect(mockClient.query.mock.calls).toStrictEqual([
            ['BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE READ ONLY;'],
            ['ROLLBACK;']
        ]);
        expect(mockClient.release.mock.calls).toStrictEqual([[]]);
        expect(mockCallback.mock.calls).toStrictEqual([[mockClient]]);
        expect(result).toStrictEqual(err('c'));
    });
});
