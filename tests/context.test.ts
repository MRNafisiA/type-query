import './__init__';
import { Table } from '../src/Table';
import { OperatorCode } from '../src/keywords';
import { createContext, createContextHelper } from '../src/context';

type UserSchema = {
    id: {
        type: number;
        nullable: true;
        default: false;
    };
};
const UserTable: Table<UserSchema> = {
    schemaName: 'public',
    tableName: 'user',
    columns: {
        id: {
            type: 'int2',
            nullable: true,
            default: false
        }
    }
};

describe('createContextHelper', () => {
    const contextHelper = createContextHelper(UserTable);
    describe('without alias', () => {
        test('without arg', () => {
            const result = contextHelper({
                id: ['= null']
            });

            expect(result).toStrictEqual([
                [
                    OperatorCode.IsNull,
                    [OperatorCode.Column, '"id"'],
                    undefined,
                    undefined
                ]
            ]);
        });
        test('one arg', () => {
            const result = contextHelper({
                id: ['>', 1]
            });

            expect(result).toStrictEqual([
                [
                    OperatorCode.IsGreater,
                    [OperatorCode.Column, '"id"'],
                    1,
                    undefined
                ]
            ]);
        });
        test('two args', () => {
            const result = contextHelper({
                id: ['between', 1, 2]
            });

            expect(result).toStrictEqual([
                [OperatorCode.Between, [OperatorCode.Column, '"id"'], 1, 2]
            ]);
        });
    });
    describe('with alias', () => {
        test('without arg', () => {
            const result = contextHelper(
                {
                    id: ['= null']
                },
                'A'
            );

            expect(result).toStrictEqual([
                [
                    OperatorCode.IsNull,
                    [OperatorCode.Column, '"A"."id"'],
                    undefined,
                    undefined
                ]
            ]);
        });
        test('one arg', () => {
            const result = contextHelper(
                {
                    id: ['>', 1]
                },
                'A'
            );

            expect(result).toStrictEqual([
                [
                    OperatorCode.IsGreater,
                    [OperatorCode.Column, '"A"."id"'],
                    1,
                    undefined
                ]
            ]);
        });
        test('two args', () => {
            const result = contextHelper(
                {
                    id: ['between', 1, 2]
                },
                'A'
            );

            expect(result).toStrictEqual([
                [OperatorCode.Between, [OperatorCode.Column, '"A"."id"'], 1, 2]
            ]);
        });
    });
});

describe('createContext', () => {
    const contextWithoutAlias = createContext(UserTable);
    describe('without alias', () => {
        test('column', () => {
            const result = contextWithoutAlias.column('id');

            expect(result).toStrictEqual([OperatorCode.Column, '"id"']);
        });
        test('compare', () => {
            const result = contextWithoutAlias.compare('id', '=', 1);

            expect(result).toStrictEqual([
                OperatorCode.IsEqual,
                [OperatorCode.Column, '"id"'],
                1,
                undefined
            ]);
        });
        test('columnsAnd', () => {
            const result = contextWithoutAlias.columnsAnd({
                id: ['= null']
            });

            expect(result).toStrictEqual([
                OperatorCode.And,
                [
                    [
                        OperatorCode.IsNull,
                        [OperatorCode.Column, '"id"'],
                        undefined,
                        undefined
                    ]
                ]
            ]);
        });
        test('columnsOr', () => {
            const result = contextWithoutAlias.columnsOr({
                id: ['= null']
            });

            expect(result).toStrictEqual([
                OperatorCode.Or,
                [
                    [
                        OperatorCode.IsNull,
                        [OperatorCode.Column, '"id"'],
                        undefined,
                        undefined
                    ]
                ]
            ]);
        });
    });
    describe('with alias', () => {
        const context = createContext(UserTable, 'A');
        test('column', () => {
            const result = context.column('id');

            expect(result).toStrictEqual([OperatorCode.Column, '"A"."id"']);
        });
        test('compare', () => {
            const result = context.compare('id', '=', 1);

            expect(result).toStrictEqual([
                OperatorCode.IsEqual,
                [OperatorCode.Column, '"A"."id"'],
                1,
                undefined
            ]);
        });
        test('columnsAnd', () => {
            const result = context.columnsAnd({
                id: ['= null']
            });

            expect(result).toStrictEqual([
                OperatorCode.And,
                [
                    [
                        OperatorCode.IsNull,
                        [OperatorCode.Column, '"A"."id"'],
                        undefined,
                        undefined
                    ]
                ]
            ]);
        });
        test('columnsOr', () => {
            const result = context.columnsOr({
                id: ['= null']
            });

            expect(result).toStrictEqual([
                OperatorCode.Or,
                [
                    [
                        OperatorCode.IsNull,
                        [OperatorCode.Column, '"A"."id"'],
                        undefined,
                        undefined
                    ]
                ]
            ]);
        });
    });
});
