import { U } from './U';
import { Table } from './types/Table';
import { Context, ContextScope } from './types/Context';

const createContext = <T extends Table>(table: T, alias: string = ''): Context<T['columns']> => {
    const contextScopeHelper = createContextScopeHelper(table);
    return {
        col: (column, _alias = alias) => U.col(table, column, !!_alias, _alias),
        colNull: (column, op, _alias = alias) => U.nullOp(U.col(table, column, !!_alias, _alias) as any, op),
        colBool: (column, op, _alias = alias) => U.boolOp(U.col(table, column, !!_alias, _alias) as any, op),
        colCmp: (column, op, v, _alias = alias) => U.cmpOp(U.col(table, column, !!_alias, _alias) as any, op, v as any),
        colList: (column, op, v, _alias = alias) =>
            U.listOp(U.col(table, column, !!_alias, _alias) as any, op, v as any),
        colLike: (column, op, v, _alias = alias) =>
            U.likeOp(U.col(table, column, !!_alias, _alias) as any, op as any, v as any),
        colJson: (column, op, v, _alias = alias) =>
            U.jsonOp(U.col(table, column, !!_alias, _alias) as any, op as any, v as any),
        colsAnd: (rules, _alias = alias) => U.andAllOp(contextScopeHelper(rules, _alias)),
        colsOr: (rules, _alias = alias) => U.orAllOp(contextScopeHelper(rules, _alias))
    };
};

const createContextScopeHelper =
    <T extends Table>(table: T) =>
    (rules: Parameters<ContextScope<T['columns']>>[0], alias: string) =>
        Object.entries(rules).map(([key, value]: [keyof T['columns'] & string, any[]]) => {
            switch (value[0]) {
                case '= null':
                case '!= null':
                    return U.nullOp(U.col(table, key, !!alias, alias) as any, value[0]);
                case '= true':
                case '= false':
                    return U.boolOp(U.col(table, key, !!alias, alias) as any, value[0]);
                case '=':
                case '!=':
                case '>':
                case '>=':
                case '<':
                case '<=':
                    return U.cmpOp(U.col(table, key, !!alias, alias) as any, value[0], value[1]);
                case 'in':
                case 'not in':
                    return U.listOp(U.col(table, key, !!alias, alias) as any, value[0], value[1]);
                case 'like':
                case 'like all':
                case 'like some':
                    return U.likeOp(U.col(table, key, !!alias, alias) as any, value[0], value[1]);
                case '@>':
                case '<@':
                case '?':
                case '?&':
                case '?|':
                    return U.jsonOp(U.col(table, key, !!alias, alias) as any, value[0], value[1]);
            }
            throw `do not except this. first element must be a reserved key. ${JSON.stringify(value)}`;
        });

export { createContext, createContextScopeHelper };
