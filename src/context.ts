import * as U from './utils';
import Decimal from 'decimal.js';
import { Json, NullableType, Schema, Table } from './Table';
import {
    LikeOperator,
    ListOperator,
    NullOperator,
    BetweenOperator,
    BooleanOperator,
    CompareOperator,
    JsonCompareOperator
} from './keywords';

type Context<S extends Schema = Schema> = {
    column: <C extends keyof S & string>(
        column: C,
        alias?: string
    ) => NullableType<S[C]['type'], S[C]['nullable']>;
    compare: <C extends keyof S & string>(
        column: C,
        ...args: ContextRule<S, C>
    ) => boolean;
    columnsAnd: (rules: ContextRules<S>, alias?: string) => boolean;
    columnsOr: (rules: ContextRules<S>, alias?: string) => boolean;
    and: <T extends undefined | null | boolean>(
        ...expressions: readonly T[]
    ) => T;
    or: <T extends undefined | null | boolean>(
        ...expressions: readonly T[]
    ) => T;
};

const createContext = <S extends Schema>(
    table: Table<S>,
    alias = ''
): Context<S> => {
    const contextHelper = createContextHelper(table);
    return {
        column: (column, _alias = alias) =>
            U.column(table, column, !!_alias, _alias),
        compare: (column, ...args) =>
            U.compare(
                U.column(table, column, !!alias, alias) as boolean,
                ...(args as ['= true'])
            ),
        columnsAnd: (rules, _alias = alias) =>
            U.and(...contextHelper(rules, _alias)),
        columnsOr: (rules, _alias = alias) =>
            U.or(...contextHelper(rules, _alias)),
        and: U.and,
        or: U.or
    };
};

type ContextRules<S extends Schema> = {
    [C in keyof S]?: ContextRule<S, C>;
};
type ContextRule<S extends Schema, C extends keyof S> =
    | (S[C]['nullable'] extends true ? [operator: NullOperator] : never)
    | (S[C]['type'] extends boolean
          ? [operator: BooleanOperator]
          : S[C]['type'] extends number
            ?
                  | [
                        operator: CompareOperator,
                        expression: NullableType<number, S[C]['nullable']>
                    ]
                  | [
                        operator: ListOperator,
                        expression: readonly NullableType<
                            number,
                            S[C]['nullable']
                        >[]
                    ]
                  | [
                        operator: BetweenOperator,
                        startExpression: NullableType<number, S[C]['nullable']>,
                        endExpression: NullableType<number, S[C]['nullable']>
                    ]
            : S[C]['type'] extends bigint
              ?
                    | [
                          operator: CompareOperator,
                          expression: NullableType<bigint, S[C]['nullable']>
                      ]
                    | [
                          operator: ListOperator,
                          expression: readonly NullableType<
                              bigint,
                              S[C]['nullable']
                          >[]
                      ]
                    | [
                          operator: BetweenOperator,
                          startExpression: NullableType<
                              bigint,
                              S[C]['nullable']
                          >,
                          endExpression: NullableType<bigint, S[C]['nullable']>
                      ]
              : S[C]['type'] extends Decimal
                ?
                      | [
                            operator: CompareOperator,
                            expression: NullableType<Decimal, S[C]['nullable']>
                        ]
                      | [
                            operator: ListOperator,
                            expression: readonly NullableType<
                                Decimal,
                                S[C]['nullable']
                            >[]
                        ]
                      | [
                            operator: BetweenOperator,
                            startExpression: NullableType<
                                Decimal,
                                S[C]['nullable']
                            >,
                            endExpression: NullableType<
                                Decimal,
                                S[C]['nullable']
                            >
                        ]
                : S[C]['type'] extends string
                  ?
                        | [
                              operator: CompareOperator | 'like',
                              expression: NullableType<string, S[C]['nullable']>
                          ]
                        | [
                              operator: ListOperator | 'like some' | 'like all',
                              expression: readonly NullableType<
                                  string,
                                  S[C]['nullable']
                              >[]
                          ]
                        | [
                              operator: BetweenOperator,
                              startExpression: NullableType<
                                  string,
                                  S[C]['nullable']
                              >,
                              endExpression: NullableType<
                                  string,
                                  S[C]['nullable']
                              >
                          ]
                  : S[C]['type'] extends Date
                    ?
                          | [
                                operator: CompareOperator,
                                expression: NullableType<Date, S[C]['nullable']>
                            ]
                          | [
                                operator: ListOperator,
                                expression: readonly NullableType<
                                    Date,
                                    S[C]['nullable']
                                >[]
                            ]
                          | [
                                operator: BetweenOperator,
                                startExpression: NullableType<
                                    Date,
                                    S[C]['nullable']
                                >,
                                endExpression: NullableType<
                                    Date,
                                    S[C]['nullable']
                                >
                            ]
                    : S[C]['type'] extends Json
                      ?
                            | [
                                  operator: '=' | '!=' | '@>' | '<@',
                                  expression: NullableType<
                                      Json,
                                      S[C]['nullable']
                                  >
                              ]
                            | [operator: '?', expression: null | string]
                            | [
                                  operator: '?&' | '?|',
                                  expression: readonly (null | string)[]
                              ]
                      : never);

const createContextHelper =
    <S extends Schema>(table: Table<S>) =>
    (rules: ContextRules<S>, alias?: string): boolean[] =>
        Object.entries(rules).map(
            ([key, value]: [keyof S & string, unknown[]]) => {
                const operator = value[0] as
                    | NullOperator
                    | BooleanOperator
                    | CompareOperator
                    | ListOperator
                    | LikeOperator
                    | JsonCompareOperator
                    | BetweenOperator;
                switch (operator) {
                    case '= null':
                    case '!= null':
                    case '= true':
                    case '= false':
                        return U.compare(
                            U.column(table, key, !!alias, alias) as boolean,
                            value[0] as BooleanOperator
                        );
                    case '=':
                    case '!=':
                    case '>':
                    case '>=':
                    case '<':
                    case '<=':
                    case 'in':
                    case 'not in':
                    case 'like':
                    case 'like all':
                    case 'like some':
                    case '@>':
                    case '<@':
                    case '?':
                    case '?&':
                    case '?|':
                        return U.compare(
                            U.column(table, key, !!alias, alias) as number,
                            value[0] as CompareOperator,
                            value[1] as number
                        );
                    case 'between':
                        return U.compare(
                            U.column(table, key, !!alias, alias) as number,
                            value[0] as BetweenOperator,
                            value[1] as number,
                            value[2] as number
                        );
                }
            }
        ) as boolean[];

export type { Context, ContextRules };
export { createContext, createContextHelper };
