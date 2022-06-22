import Table from './table';
import {PoolClient} from 'pg';
import {Result} from 'never-catch';
import {SimpleModel} from './model';
import {ColumnTypeByColumns} from './postgres';
import {NullableAndDefaultColumns} from './entity';
import {Pool, TransactionIsolationLevel} from './pool';

type TestTableData<T extends Table> = {
    table: T;
    startData: (
        { [columnKey in Exclude<keyof T['columns'], keyof NullableAndDefaultColumns<T['columns']>>]: ColumnTypeByColumns<T['columns'], columnKey>; }
        &
        { [columnKey in keyof NullableAndDefaultColumns<T['columns']>]?: ColumnTypeByColumns<T['columns'], columnKey & string>; }
        )[];
    finalData: ((rows: SimpleModel<T>[]) => Result<any, any> | Promise<Result<any, any>>) |
        {
            row: {
                [columnKey in keyof T['columns']]:
                ((cell: ColumnTypeByColumns<T['columns'], columnKey>, row: SimpleModel<T>, rows: SimpleModel<T>[]) => Result<any, any> | Promise<Result<any, any>>) |
                ColumnTypeByColumns<T['columns'], columnKey>;
            },
            useTime?: ['equal', number] | ['moreThanEqual', number] | ['lessThanEqual', number] | undefined
        }[];
    skipIt?: ((row: SimpleModel<T>) => Result<any, any> | Promise<Result<any, any>>) | undefined;
    lengthCheck?: ((rows: SimpleModel<T>[]) => Result<any, any> | Promise<Result<any, any>>) | number | undefined;
};
type TestTransaction = (data: TestTableData<any>[], callback: (client: PoolClient) => void, pool: Pool, isolationLevel?: TransactionIsolationLevel, rollback?: boolean) =>
    Promise<Result<undefined, any>>;
type CreateTestTableData = <T extends Table>(
    table: T,
    startData: TestTableData<T>['startData'],
    finalData: TestTableData<T>['finalData'],
    skipIt?: TestTableData<T>['skipIt'],
    lengthCheck?: TestTableData<T>['lengthCheck']
) => TestTableData<T>

export type {TestTableData, TestTransaction, CreateTestTableData};
