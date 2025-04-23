/* eslint-disable no-fallthrough */
// noinspection FallThroughInSwitchStatementJS

import * as U from './utils';
import Decimal from 'decimal.js';
import { Schema, Table } from './Table';
import { err, ok, Result } from 'never-catch';
import { Dictionary, OperatorCode } from './keywords';
import { CustomColumn, Mode, QueryResult } from './entity';

type PartialQuery = { text: string; params: string[] };
const partialQuery = (
    text: string = '',
    params: string[] = []
): PartialQuery => ({ text, params });

/*
 ** currently all errors are handled with types and no dynamic check is required.
 ** errors return only when ignore is false and an expression needs ignorance.
 ** so, some errors written in function, but they will never be returned.
 ** e.g.
 ** if (e1Result.value.text === '') {
 **     return ignore ? ok(partialQuery()) : err(`<${toDescription(expression[0])}> -> neutral`);
 ** }
 * if result is neutral then ignore is true, so error in this example will never be returned.
 * but they exist in case new errors with dynamic check added.
 */
const resolveExpression = (
    expression: unknown,
    paramsStart: number,
    ignore: boolean = false
): Result<PartialQuery, string> => {
    // primitive expression
    if (expression === undefined) {
        return ignore ? ok(partialQuery()) : err('undefined');
    }
    if (
        expression === null ||
        typeof expression === 'boolean' ||
        Decimal.isDecimal(expression) ||
        expression instanceof Date ||
        typeof expression === 'number' ||
        typeof expression === 'bigint'
    ) {
        return ok(partialQuery(U.stringify(expression, true)));
    }
    if (typeof expression === 'string') {
        return ok(
            partialQuery(`$${paramsStart++}`, [U.stringify(expression, false)])
        );
    }
    if (!Array.isArray(expression)) {
        return ok(
            partialQuery(`$${paramsStart++}::JSONB`, [
                U.stringify(expression, false)
            ])
        );
    }

    // wrapped expression
    const tokens = [];
    const operator = expression[0] as OperatorCode;
    if (operator === OperatorCode.Value) {
        if (expression[1] === undefined) {
            return ignore
                ? ok(partialQuery())
                : err(
                      `${Dictionary.OperatorDescriptions[operator]} -> undefined`
                  );
        }
        return ok(
            partialQuery(`$${paramsStart++}`, [
                U.stringify(expression[1], false)
            ])
        );
    }
    if (
        operator === OperatorCode.IsNull ||
        operator === OperatorCode.IsNotNull ||
        operator === OperatorCode.IsTrue ||
        operator === OperatorCode.IsFalse ||
        operator === OperatorCode.Not
    ) {
        const expressionResult = resolveExpression(
            expression[1],
            paramsStart,
            ignore
        );
        if (!expressionResult.ok) {
            return err(
                `${Dictionary.OperatorDescriptions[operator]} -> ${expressionResult.error}`
            );
        }
        if (expressionResult.value.text === '') {
            return ignore
                ? ok(partialQuery())
                : err(
                      `${Dictionary.OperatorDescriptions[operator]} -> neutral`
                  );
        }

        switch (operator) {
            case OperatorCode.IsNull:
                return ok(
                    partialQuery(
                        `${expressionResult.value.text} IS NULL`,
                        expressionResult.value.params
                    )
                );
            case OperatorCode.IsNotNull:
                return ok(
                    partialQuery(
                        `${expressionResult.value.text} IS NOT NULL`,
                        expressionResult.value.params
                    )
                );
            case OperatorCode.IsTrue:
                return ok(
                    partialQuery(
                        expressionResult.value.text,
                        expressionResult.value.params
                    )
                );
            case OperatorCode.IsFalse:
            case OperatorCode.Not:
                return ok(
                    partialQuery(
                        `NOT ${expressionResult.value.text}`,
                        expressionResult.value.params
                    )
                );
        }
    }
    if (
        operator === OperatorCode.Sum ||
        operator === OperatorCode.Subtract ||
        operator === OperatorCode.Multiply ||
        operator === OperatorCode.Divide ||
        operator === OperatorCode.Power ||
        operator === OperatorCode.Concat ||
        operator === OperatorCode.And ||
        operator === OperatorCode.Or
    ) {
        const params: string[] = [];

        for (const item of expression[1]) {
            const itemResult = resolveExpression(item, paramsStart, ignore);
            if (!itemResult.ok) {
                return err(
                    `${Dictionary.OperatorDescriptions[operator]} -> ${expression[1].indexOf(item)} -> ${itemResult.error}`
                );
            }
            if (itemResult.value.text === '') {
                if (ignore) {
                    continue;
                } else {
                    return err(
                        `${Dictionary.OperatorDescriptions[operator]} -> ${expression[1].indexOf(item)} -> neutral`
                    );
                }
            }
            params.push(...itemResult.value.params);
            paramsStart += itemResult.value.params.length;
            tokens.push(itemResult.value.text);
        }

        switch (tokens.length) {
            case 0:
                return ignore
                    ? ok(partialQuery())
                    : err(
                          `${Dictionary.OperatorDescriptions[operator]} -> no operands given`
                      );
            case 1:
                return ok(partialQuery(tokens[0], params));
            default:
                switch (operator) {
                    case OperatorCode.Sum:
                        return ok(
                            partialQuery(`(${tokens.join(' + ')})`, params)
                        );
                    case OperatorCode.Subtract:
                        return ok(
                            partialQuery(`(${tokens.join(' - ')})`, params)
                        );
                    case OperatorCode.Multiply:
                        return ok(
                            partialQuery(`(${tokens.join(' * ')})`, params)
                        );
                    case OperatorCode.Divide:
                        return ok(
                            partialQuery(`(${tokens.join(' / ')})`, params)
                        );
                    case OperatorCode.Concat:
                        return ok(
                            partialQuery(`(${tokens.join(' || ')})`, params)
                        );
                    case OperatorCode.And:
                        return ok(
                            partialQuery(`(${tokens.join(' AND ')})`, params)
                        );
                    case OperatorCode.Or:
                        return ok(
                            partialQuery(`(${tokens.join(' OR ')})`, params)
                        );
                }
                if (operator === OperatorCode.Power) {
                    const tmp = tokens.pop();
                    tokens.splice(0, 0, 'a');
                    return ok(
                        partialQuery(
                            tokens.join(', POWER(').substring(3) +
                                ', ' +
                                tmp +
                                ')'.repeat(tokens.length - 1),
                            params
                        )
                    );
                }
        }
    }
    if (operator === OperatorCode.Function) {
        const params: string[] = [];
        for (const item of expression[2]) {
            const itemResult = resolveExpression(item, paramsStart, ignore);
            if (!itemResult.ok) {
                return err(
                    `${Dictionary.OperatorDescriptions[operator]} -> parameters -> ${expression[2].indexOf(item)} -> ${itemResult.error}`
                );
            }
            if (itemResult.value.text === '') {
                return ignore
                    ? ok(partialQuery())
                    : err(
                          `${Dictionary.OperatorDescriptions[operator]} -> parameters -> ${expression[2].indexOf(item)} -> neutral`
                      );
            }
            params.push(...itemResult.value.params);
            paramsStart += itemResult.value.params.length;
            tokens.push(itemResult.value.text);
        }
        return ok(
            partialQuery(
                `${expression[1]}(${tokens.join(', ')})${expression[3]}`,
                params
            )
        );
    }
    if (operator === OperatorCode.SwitchCase) {
        const params: string[] = [];
        for (const item of expression[1]) {
            const whenResult = resolveExpression(
                item.when,
                paramsStart,
                ignore
            );
            if (!whenResult.ok) {
                return err(
                    `${Dictionary.OperatorDescriptions[operator]} -> cases -> ${expression[1].indexOf(item)} -> when -> ${
                        whenResult.error
                    }`
                );
            }
            if (whenResult.value.text === '') {
                if (ignore) {
                    continue;
                } else {
                    return err(
                        `${Dictionary.OperatorDescriptions[operator]} -> cases -> ${expression[1].indexOf(item)} -> when -> neutral`
                    );
                }
            }
            params.push(...whenResult.value.params);
            paramsStart += whenResult.value.params.length;

            const thenResult = resolveExpression(
                item.then,
                paramsStart,
                ignore
            );
            if (!thenResult.ok) {
                return err(
                    `${Dictionary.OperatorDescriptions[operator]} -> cases -> ${expression[1].indexOf(item)} -> then -> ${
                        thenResult.error
                    }`
                );
            }
            if (thenResult.value.text === '') {
                if (ignore) {
                    continue;
                } else {
                    return err(
                        `${Dictionary.OperatorDescriptions[operator]} -> cases -> ${expression[1].indexOf(item)} -> then -> neutral`
                    );
                }
            }
            params.push(...thenResult.value.params);
            paramsStart += thenResult.value.params.length;

            if (tokens.length === 0) {
                tokens.push('CASE');
            }
            tokens.push(
                `WHEN ${whenResult.value.text} THEN ${thenResult.value.text}`
            );
        }
        if (tokens.length === 0 && !ignore) {
            return err(
                `${Dictionary.OperatorDescriptions[operator]} -> cases -> empty`
            );
        }

        if (expression[2] === undefined && tokens.length !== 0) {
            tokens.push('END');
            return ok(partialQuery(tokens.join(' '), params));
        }
        const otherwiseResult = resolveExpression(
            expression[2],
            paramsStart,
            ignore
        );
        if (!otherwiseResult.ok) {
            return err(
                `${Dictionary.OperatorDescriptions[operator]} -> otherwise -> ${otherwiseResult.error}`
            );
        }
        params.push(...otherwiseResult.value.params);
        if (otherwiseResult.value.text === '') {
            if (ignore) {
                if (tokens.length === 0) {
                    return ok(partialQuery());
                } else {
                    tokens.push('END');
                }
            } else {
                return err(
                    `${Dictionary.OperatorDescriptions[operator]} -> otherwise -> neutral`
                );
            }
        } else {
            if (tokens.length !== 0) {
                tokens.push('ELSE', otherwiseResult.value.text, 'END');
            } else {
                tokens.push(otherwiseResult.value.text);
            }
        }
        return ok(partialQuery(tokens.join(' '), params));
    }
    if (operator === OperatorCode.Column) {
        return ok(partialQuery(`${expression[1]}`));
    }
    if (operator === OperatorCode.Raw) {
        const rawExpression =
            typeof expression[1] === 'function'
                ? expression[1](paramsStart)
                : { expression: expression[1], params: [] };
        return ok(partialQuery(rawExpression.expression, rawExpression.params));
    }
    if (operator === OperatorCode.Ignore) {
        const expressionResult = resolveExpression(
            expression[1],
            paramsStart,
            true
        );
        if (!expressionResult.ok) {
            return err(
                `${Dictionary.OperatorDescriptions[operator]} -> expression -> ${expressionResult.error}`
            );
        }
        if (expressionResult.value.text !== '') {
            return ok(
                partialQuery(
                    expressionResult.value.text,
                    expressionResult.value.params
                )
            );
        }

        const otherwiseResult = resolveExpression(
            expression[2],
            paramsStart,
            false
        );
        if (!otherwiseResult.ok) {
            return err(
                `${Dictionary.OperatorDescriptions[operator]} -> otherwise -> ${otherwiseResult.error}`
            );
        }
        if (otherwiseResult.value.text === '') {
            return err(
                `${Dictionary.OperatorDescriptions[operator]} -> otherwise -> neutral`
            );
        }
        return ok(
            partialQuery(
                otherwiseResult.value.text,
                otherwiseResult.value.params
            )
        );
    }
    if (
        operator === OperatorCode.InListSubQuery ||
        operator === OperatorCode.NotInListSubQuery
    ) {
        const params: string[] = [];

        const expressionResult = resolveExpression(
            expression[1],
            paramsStart,
            ignore
        );
        if (!expressionResult.ok) {
            return err(
                `${Dictionary.OperatorDescriptions[operator]} -> first operand -> ${expressionResult.error}`
            );
        }
        if (expressionResult.value.text === '') {
            return ignore
                ? ok(partialQuery())
                : err(
                      `${Dictionary.OperatorDescriptions[operator]} -> first operand -> neutral`
                  );
        }
        params.push(...expressionResult.value.params);
        paramsStart += expressionResult.value.params.length;

        const subQueryResult = expression[2].getData(
            Array(paramsStart - 1).fill(undefined)
        );
        if (!subQueryResult.ok) {
            return err(
                `${Dictionary.OperatorDescriptions[operator]} -> ${subQueryResult.error}`
            );
        }

        switch (operator) {
            case OperatorCode.InListSubQuery:
                return ok(
                    partialQuery(
                        `${expressionResult.value.text} IN (${subQueryResult.value.sql})`,
                        subQueryResult.value.params.slice(paramsStart - 1)
                    )
                );
            case OperatorCode.NotInListSubQuery:
                return ok(
                    partialQuery(
                        `${expressionResult.value.text} NOT IN (${subQueryResult.value.sql})`,
                        subQueryResult.value.params.slice(paramsStart - 1)
                    )
                );
        }
    }
    if (
        operator === OperatorCode.IsEqual ||
        operator === OperatorCode.IsNotEqual ||
        operator === OperatorCode.IsGreater ||
        operator === OperatorCode.IsGreaterEqual ||
        operator === OperatorCode.IsLess ||
        operator === OperatorCode.IsLessEqual ||
        operator === OperatorCode.Like ||
        operator === OperatorCode.JsonExist ||
        operator === OperatorCode.JsonRightExist ||
        operator === OperatorCode.JsonLeftExist ||
        operator === OperatorCode.JsonRemove ||
        operator === OperatorCode.JsonIndex ||
        operator === OperatorCode.JsonIndexText
    ) {
        const params: string[] = [];

        const expression1Result = resolveExpression(
            expression[1],
            paramsStart,
            ignore
        );
        if (!expression1Result.ok) {
            return err(
                `${Dictionary.OperatorDescriptions[operator]} -> first operand -> ${expression1Result.error}`
            );
        }
        if (expression1Result.value.text === '') {
            return ignore
                ? ok(partialQuery())
                : err(
                      `${Dictionary.OperatorDescriptions[operator]} -> first operand -> neutral`
                  );
        }
        params.push(...expression1Result.value.params);
        paramsStart += expression1Result.value.params.length;

        const expression2Result = resolveExpression(
            expression[2],
            paramsStart,
            ignore
        );
        if (!expression2Result.ok) {
            return err(
                `${Dictionary.OperatorDescriptions[operator]} -> second operand -> ${expression2Result.error}`
            );
        }
        if (expression2Result.value.text === '') {
            return ignore
                ? ok(partialQuery())
                : err(
                      `${Dictionary.OperatorDescriptions[operator]} -> second operand -> neutral`
                  );
        }
        params.push(...expression2Result.value.params);

        switch (operator) {
            case OperatorCode.IsEqual:
                return ok(
                    partialQuery(
                        `${expression1Result.value.text} = ${expression2Result.value.text}`,
                        params
                    )
                );
            case OperatorCode.IsNotEqual:
                return ok(
                    partialQuery(
                        `${expression1Result.value.text} <> ${expression2Result.value.text}`,
                        params
                    )
                );
            case OperatorCode.IsGreater:
                return ok(
                    partialQuery(
                        `${expression1Result.value.text} > ${expression2Result.value.text}`,
                        params
                    )
                );
            case OperatorCode.IsGreaterEqual:
                return ok(
                    partialQuery(
                        `${expression1Result.value.text} >= ${expression2Result.value.text}`,
                        params
                    )
                );
            case OperatorCode.IsLess:
                return ok(
                    partialQuery(
                        `${expression1Result.value.text} < ${expression2Result.value.text}`,
                        params
                    )
                );
            case OperatorCode.IsLessEqual:
                return ok(
                    partialQuery(
                        `${expression1Result.value.text} <= ${expression2Result.value.text}`,
                        params
                    )
                );
            case OperatorCode.Like:
                return ok(
                    partialQuery(
                        `${expression1Result.value.text} LIKE ${expression2Result.value.text}`,
                        params
                    )
                );
            case OperatorCode.JsonExist:
                return ok(
                    partialQuery(
                        `${expression1Result.value.text} ? ${expression2Result.value.text}`,
                        params
                    )
                );
            case OperatorCode.JsonRightExist:
                return ok(
                    partialQuery(
                        `${expression1Result.value.text} @> ${expression2Result.value.text}`,
                        params
                    )
                );
            case OperatorCode.JsonLeftExist:
                return ok(
                    partialQuery(
                        `${expression1Result.value.text} <@ ${expression2Result.value.text}`,
                        params
                    )
                );
            case OperatorCode.JsonRemove:
                return ok(
                    partialQuery(
                        `${expression1Result.value.text} - ${expression2Result.value.text}`,
                        params
                    )
                );
            case OperatorCode.JsonIndex:
                return ok(
                    partialQuery(
                        `${expression1Result.value.text} -> ${expression2Result.value.text}`,
                        params
                    )
                );
            case OperatorCode.JsonIndexText:
                return ok(
                    partialQuery(
                        expression[3] === undefined
                            ? `${expression1Result.value.text} ->> ${expression2Result.value.text}`
                            : `(${expression1Result.value.text} ->> ${expression2Result.value.text})${expression[3]}`,
                        params
                    )
                );
        }
    }
    if (
        operator === OperatorCode.InList ||
        operator === OperatorCode.NotInList ||
        operator === OperatorCode.LikeAll ||
        operator === OperatorCode.LikeSome ||
        operator === OperatorCode.JsonSomeExist ||
        operator === OperatorCode.JsonAllExist ||
        operator === OperatorCode.JsonRemoveAll ||
        operator === OperatorCode.JsonIndexChain
    ) {
        const params: string[] = [];

        const expressionResult = resolveExpression(
            expression[1],
            paramsStart,
            ignore
        );
        if (!expressionResult.ok) {
            return err(
                `${Dictionary.OperatorDescriptions[operator]} -> first operand -> ${expressionResult.error}`
            );
        }
        if (expressionResult.value.text === '') {
            return ignore
                ? ok(partialQuery())
                : err(
                      `${Dictionary.OperatorDescriptions[operator]} -> first operand -> neutral`
                  );
        }
        params.push(...expressionResult.value.params);
        paramsStart += expressionResult.value.params.length;

        for (const item of expression[2]) {
            const itemResult = resolveExpression(item, paramsStart, ignore);
            if (!itemResult.ok) {
                return err(
                    `${Dictionary.OperatorDescriptions[operator]} -> second operand -> ${expression[2].indexOf(
                        item
                    )} -> ${itemResult.error}`
                );
            }
            if (itemResult.value.text === '') {
                if (ignore) {
                    continue;
                } else {
                    return err(
                        `${Dictionary.OperatorDescriptions[operator]} -> second operand -> ${expression[1].indexOf(item)} -> neutral`
                    );
                }
            }
            params.push(...itemResult.value.params);
            paramsStart += itemResult.value.params.length;
            tokens.push(itemResult.value.text);
        }

        switch (tokens.length) {
            case 0:
                return ignore
                    ? ok(partialQuery())
                    : err(
                          `${Dictionary.OperatorDescriptions[operator]} -> second operand -> empty`
                      );
            case 1:
                switch (operator) {
                    case OperatorCode.InList:
                        return ok(
                            partialQuery(
                                `${expressionResult.value.text} = ${tokens[0]}`,
                                params
                            )
                        );
                    case OperatorCode.NotInList:
                        return ok(
                            partialQuery(
                                `${expressionResult.value.text} <> ${tokens[0]}`,
                                params
                            )
                        );
                    case OperatorCode.LikeAll:
                        return ok(
                            partialQuery(
                                `${expressionResult.value.text} LIKE ${tokens[0]}`,
                                params
                            )
                        );
                    case OperatorCode.LikeSome:
                        return ok(
                            partialQuery(
                                `${expressionResult.value.text} LIKE ${tokens[0]}`,
                                params
                            )
                        );
                    case OperatorCode.JsonSomeExist:
                        return ok(
                            partialQuery(
                                `${expressionResult.value.text} ? ${tokens[0]}`,
                                params
                            )
                        );
                    case OperatorCode.JsonAllExist:
                        return ok(
                            partialQuery(
                                `${expressionResult.value.text} ? ${tokens[0]}`,
                                params
                            )
                        );
                    case OperatorCode.JsonRemoveAll:
                        return ok(
                            partialQuery(
                                `${expressionResult.value.text} - ${tokens[0]}`,
                                params
                            )
                        );
                    case OperatorCode.JsonIndexChain:
                        return ok(
                            partialQuery(
                                `${expressionResult.value.text} -> ${tokens[0]}`,
                                params
                            )
                        );
                }
            default:
                switch (operator) {
                    case OperatorCode.InList:
                        return ok(
                            partialQuery(
                                `${expressionResult.value.text} IN (${tokens.join(', ')})`,
                                params
                            )
                        );
                    case OperatorCode.NotInList:
                        return ok(
                            partialQuery(
                                `${expressionResult.value.text} NOT IN (${tokens.join(', ')})`,
                                params
                            )
                        );
                    case OperatorCode.LikeAll:
                        return ok(
                            partialQuery(
                                `${expressionResult.value.text} LIKE ALL(ARRAY[${tokens.join(', ')}])`,
                                params
                            )
                        );
                    case OperatorCode.LikeSome:
                        return ok(
                            partialQuery(
                                `${expressionResult.value.text} LIKE SOME(ARRAY[${tokens.join(', ')}])`,
                                params
                            )
                        );
                    case OperatorCode.JsonSomeExist:
                        return ok(
                            partialQuery(
                                `${expressionResult.value.text} ?| ARRAY[${tokens.join(', ')}]`,
                                params
                            )
                        );
                    case OperatorCode.JsonAllExist:
                        return ok(
                            partialQuery(
                                `${expressionResult.value.text} ?& ARRAY[${tokens.join(', ')}]`,
                                params
                            )
                        );
                    case OperatorCode.JsonRemoveAll:
                        return ok(
                            partialQuery(
                                `${expressionResult.value.text} - ARRAY[${tokens.join(', ')}]`,
                                params
                            )
                        );
                    case OperatorCode.JsonIndexChain:
                        return ok(
                            partialQuery(
                                `${expressionResult.value.text} ${tokens.map(token => `-> ${token}`).join(' ')}`,
                                params
                            )
                        );
                }
        }
    }
    if (operator === OperatorCode.Between) {
        const params: string[] = [];

        const expressionResult = resolveExpression(
            expression[1],
            paramsStart,
            ignore
        );
        if (!expressionResult.ok) {
            return err(
                `${Dictionary.OperatorDescriptions[operator]} -> first operand -> ${expressionResult.error}`
            );
        }
        if (expressionResult.value.text === '') {
            return ignore
                ? ok(partialQuery())
                : err(
                      `${Dictionary.OperatorDescriptions[operator]} -> first operand -> neutral`
                  );
        }
        params.push(...expressionResult.value.params);
        paramsStart += expressionResult.value.params.length;

        const startExpressionResult = resolveExpression(
            expression[2],
            paramsStart,
            ignore
        );
        if (!startExpressionResult.ok) {
            return err(
                `${Dictionary.OperatorDescriptions[operator]} -> second operand -> ${startExpressionResult.error}`
            );
        }
        if (startExpressionResult.value.text === '') {
            return ignore
                ? ok(partialQuery())
                : err(
                      `${Dictionary.OperatorDescriptions[operator]} -> second operand -> neutral`
                  );
        }
        params.push(...startExpressionResult.value.params);
        paramsStart += startExpressionResult.value.params.length;

        const endExpressionResult = resolveExpression(
            expression[3],
            paramsStart,
            ignore
        );
        if (!endExpressionResult.ok) {
            return err(
                `${Dictionary.OperatorDescriptions[operator]} -> third operand -> ${endExpressionResult.error}`
            );
        }
        if (endExpressionResult.value.text === '') {
            return ignore
                ? ok(partialQuery())
                : err(
                      `${Dictionary.OperatorDescriptions[operator]} -> third operand -> neutral`
                  );
        }
        params.push(...endExpressionResult.value.params);

        return ok(
            partialQuery(
                `${expressionResult.value.text} BETWEEN ${startExpressionResult.value.text} AND ${endExpressionResult.value.text}`,
                params
            )
        );
    }
    if (
        operator === OperatorCode.SubQuery ||
        operator === OperatorCode.SubQueryExist
    ) {
        const subQueryResult = expression[1].getData(
            Array(paramsStart - 1).fill(undefined)
        );
        if (!subQueryResult.ok) {
            return err(
                `${Dictionary.OperatorDescriptions[operator]} -> ${subQueryResult.error}`
            );
        }

        switch (operator) {
            case OperatorCode.SubQuery:
                return ok(
                    partialQuery(
                        `(${subQueryResult.value.sql})`,
                        subQueryResult.value.params.slice(paramsStart - 1)
                    )
                );
            case OperatorCode.SubQueryExist:
                return ok(
                    partialQuery(
                        `EXISTS(${subQueryResult.value.sql})`,
                        subQueryResult.value.params.slice(paramsStart - 1)
                    )
                );
        }
    }

    return ok(
        partialQuery(`$${paramsStart++}::JSONB`, [
            U.stringify(expression, false)
        ])
    );
};

const resolveColumn = (
    table: Table,
    column: string,
    full: boolean = true,
    alias?: string
) => {
    let prefix: string;
    if (full) {
        if (alias !== undefined) {
            prefix = `"${alias}".`;
        } else {
            prefix = `"${table.schemaName}"."${table.tableName}".`;
        }
    } else {
        prefix = '';
    }
    return prefix + `"${table.columns[column].title ?? column}"`;
};

const resolveReturning = (
    getColumnTitleAndAlias: (
        column: string
    ) => [title: string | undefined, alias: string | undefined],
    columns: readonly (string | CustomColumn<unknown, string>)[],
    paramsStart: number
): Result<PartialQuery, string> => {
    const tokens = [];
    const params: string[] = [];
    for (const column of columns) {
        if (typeof column === 'object') {
            const resolvedExpResult = resolveExpression(
                column.expression,
                paramsStart,
                false
            );
            if (!resolvedExpResult.ok) {
                return err(
                    `returning -> ${column.name} -> ${resolvedExpResult.error}`
                );
            }
            if (resolvedExpResult.value.text === '') {
                return err(`returning -> ${column.name} -> neutral`);
            }
            params.push(...resolvedExpResult.value.params);
            paramsStart += resolvedExpResult.value.params.length;

            tokens.push(
                `(${resolvedExpResult.value.text}) AS "${column.name}"`
            );
        } else {
            const [title, alias] = getColumnTitleAndAlias(column);
            if (title === undefined) {
                if (alias !== undefined) {
                    tokens.push(
                        `"${alias}".` +
                            `"${column.substring((alias + '_').length)}"` +
                            ` AS "${column}"`
                    );
                } else {
                    tokens.push(`"${column}"`);
                }
            } else {
                tokens.push(
                    (alias !== undefined ? `"${alias}".` : '') +
                        `"${title}"` +
                        ` AS "${column}"`
                );
            }
        }
    }
    if (tokens.length === 0) {
        return err('returning -> empty');
    }
    return ok(partialQuery(tokens.join(', '), params));
};

const resolveResult = <
    S extends Schema,
    R extends readonly (keyof S | CustomColumn<unknown, string>)[],
    M extends Mode
>(
    rows: unknown[],
    mode: M
): Result<QueryResult<S, R, M>, false> => {
    if (mode[0] === 'count') {
        return rows.length === mode[1]
            ? ok(undefined as QueryResult<S, R, M>)
            : err(false);
    }
    if (
        mode[0] === 'get' &&
        rows.length !== (mode[1] === 'one' ? 1 : mode[1])
    ) {
        return err(false);
    }

    if (mode[0] === 'get' && mode[1] === 'one') {
        return ok(rows[0] as QueryResult<S, R, M>);
    } else {
        return ok(rows as QueryResult<S, R, M>);
    }
};

export type { PartialQuery };
export {
    partialQuery,
    resolveExpression,
    resolveColumn,
    resolveReturning,
    resolveResult
};
