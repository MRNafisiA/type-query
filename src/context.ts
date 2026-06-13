import * as U from './utils';
import Decimal from 'decimal.js';
import { Query } from './entity';
import {
    Json,
    Table,
    Schema,
    Columns,
    NullableType,
    SchemaByColumns
} from './Table';
import {
    LikeOperator,
    ListOperator,
    NullOperator,
    BetweenOperator,
    BooleanOperator,
    CompareOperator,
    JsonCompareOperator,
    ListWithSubQueryOperator
} from './keywords';

type Context<S extends Schema> = {
    column: <K extends keyof S & string>(
        column: K,
        alias?: string
    ) => NullableType<S[K]['type'], S[K]['nullable']>;
    compare: <K extends keyof S & string>(
        column: K,
        ...args: ContextRule<S, K>
    ) => boolean;
    columnsAnd: (rules: ContextRules<S>, alias?: string) => boolean;
    columnsOr: (rules: ContextRules<S>, alias?: string) => boolean;
};

const createContext = <C extends Columns>(
    table: Table<C>,
    alias = ''
): Context<SchemaByColumns<C>> => {
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
            U.or(...contextHelper(rules, _alias))
    };
};

type ContextRules<S extends Schema> = {
    [K in keyof S]?: ContextRule<S, K>;
};

type ContextRule<S extends Schema, K extends keyof S> =
    | (S[K]['nullable'] extends true ? [operator: NullOperator] : never)
    | (S[K]['type'] extends boolean
          ? [operator: BooleanOperator]
          : S[K]['type'] extends number
            ?
                  | [
                        operator: CompareOperator,
                        expression: NullableType<number, S[K]['nullable']>
                    ]
                  | [
                        operator: ListOperator,
                        expression: readonly NullableType<
                            number,
                            S[K]['nullable']
                        >[]
                    ]
                  | [
                        operator: ListWithSubQueryOperator,
                        subQuery: Query<Schema, never>
                    ]
                  | [
                        operator: BetweenOperator,
                        startExpression: NullableType<number, S[K]['nullable']>,
                        endExpression: NullableType<number, S[K]['nullable']>
                    ]
            : S[K]['type'] extends bigint
              ?
                    | [
                          operator: CompareOperator,
                          expression: NullableType<bigint, S[K]['nullable']>
                      ]
                    | [
                          operator: ListOperator,
                          expression: readonly NullableType<
                              bigint,
                              S[K]['nullable']
                          >[]
                      ]
                    | [
                          operator: ListWithSubQueryOperator,
                          subQuery: Query<Schema, never>
                      ]
                    | [
                          operator: BetweenOperator,
                          startExpression: NullableType<
                              bigint,
                              S[K]['nullable']
                          >,
                          endExpression: NullableType<bigint, S[K]['nullable']>
                      ]
              : S[K]['type'] extends Decimal
                ?
                      | [
                            operator: CompareOperator,
                            expression: NullableType<Decimal, S[K]['nullable']>
                        ]
                      | [
                            operator: ListOperator,
                            expression: readonly NullableType<
                                Decimal,
                                S[K]['nullable']
                            >[]
                        ]
                      | [
                            operator: ListWithSubQueryOperator,
                            subQuery: Query<Schema, never>
                        ]
                      | [
                            operator: BetweenOperator,
                            startExpression: NullableType<
                                Decimal,
                                S[K]['nullable']
                            >,
                            endExpression: NullableType<
                                Decimal,
                                S[K]['nullable']
                            >
                        ]
                : S[K]['type'] extends string
                  ?
                        | [
                              operator: CompareOperator | 'like',
                              expression: NullableType<string, S[K]['nullable']>
                          ]
                        | [
                              operator: ListOperator | 'like some' | 'like all',
                              expression: readonly NullableType<
                                  string,
                                  S[K]['nullable']
                              >[]
                          ]
                        | [
                              operator: ListWithSubQueryOperator,
                              subQuery: Query<Schema, never>
                          ]
                        | [
                              operator: BetweenOperator,
                              startExpression: NullableType<
                                  string,
                                  S[K]['nullable']
                              >,
                              endExpression: NullableType<
                                  string,
                                  S[K]['nullable']
                              >
                          ]
                  : S[K]['type'] extends Date
                    ?
                          | [
                                operator: CompareOperator,
                                expression: NullableType<Date, S[K]['nullable']>
                            ]
                          | [
                                operator: ListOperator,
                                expression: readonly NullableType<
                                    Date,
                                    S[K]['nullable']
                                >[]
                            ]
                          | [
                                operator: ListWithSubQueryOperator,
                                subQuery: Query<Schema, never>
                            ]
                          | [
                                operator: BetweenOperator,
                                startExpression: NullableType<
                                    Date,
                                    S[K]['nullable']
                                >,
                                endExpression: NullableType<
                                    Date,
                                    S[K]['nullable']
                                >
                            ]
                    : S[K]['type'] extends Json
                      ?
                            | [
                                  operator: '=' | '!=' | '@>' | '<@',
                                  expression: NullableType<
                                      Json,
                                      S[K]['nullable']
                                  >
                              ]
                            | [operator: '?', expression: null | string]
                            | [
                                  operator: '?&' | '?|',
                                  expression: readonly (null | string)[]
                              ]
                            | [operator: '@@', expression: string]
                      : never);

const createContextHelper =
    <C extends Columns>(table: Table<C>) =>
    (rules: ContextRules<SchemaByColumns<C>>, alias?: string): boolean[] =>
        Object.entries(rules).map(
            ([key, value]: [keyof C & string, unknown[] | undefined]) => {
                if (value === undefined) {
                    throw `undefined value is not allowed for ${key}`;
                }
                const operator = value[0] as
                    | NullOperator
                    | BooleanOperator
                    | CompareOperator
                    | ListOperator
                    | ListWithSubQueryOperator
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
                    case 'in sub-query':
                    case 'not in sub-query':
                    case 'like':
                    case 'like all':
                    case 'like some':
                    case '@>':
                    case '<@':
                    case '?':
                    case '?&':
                    case '?|':
                    case '@@':
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
