import {Pool, PoolClient} from 'pg';
import Entity from './types/Entity';
import entity from './types/Entity';
import Expression from './types/Expression';
import {GetNullableColumns, TQ, TqUtilsBuilder} from './Utils';
import {OrderDirection, PostgresTypeMapper} from './types/Postgres';

type CustomColumn<A> = { raw: string, as: A };

const resolveSelect = <E extends Entity>(entity: E, columns: readonly(keyof E['columns'] | CustomColumn<string>)[]) =>
    columns.map(e => typeof e === 'object' ? `${e.raw} AS "${e.as}"` : `"${entity.schema}"."${entity.title}".${entity.columns[e].title === undefined ? `"${e}"` : `"${entity.columns[e].title}" AS "${e}"`}`).join(', ');

const resolveExpression = (expression: Expression<any>, params: any[], ignore: boolean): string | boolean => {
    const paramsLen = params.length;
    if (expression === undefined) {
        return params.splice(paramsLen, params.length - paramsLen) && ignore;
    }
    const tokens = [];
    let _e1, _e2, _e3;
    switch (expression[0]) {
        case 'val':
            if (expression[1] === undefined) {
                return params.splice(paramsLen, params.length - paramsLen) && ignore;
            }
            return `$${params.push(TQ.stringify(expression[1]))}`;
        case '!':
        case 'is':
        case 'isn':
        case 'not':
            _e1 = resolveExpression(expression[1], params, ignore);
            if (_e1 === false) {
                return params.splice(paramsLen, params.length - paramsLen) && false;
            }
            if (_e1 === true) {
                return params.splice(paramsLen, params.length - paramsLen) && ignore;
            }
            switch (expression[0]) {
                case '!':
                    return `NOT ${_e1}`;
                case 'is':
                    return `${_e1} IS NULL`;
                case 'isn':
                    return `${_e1} IS NOT NULL`;
                case 'not':
                    return `NOT (${_e1})`;
            }
            break;
        case '+':
        case '-':
        case '*':
        case '/':
        case '||':
        case 'and':
        case 'or':
            if (expression[1] === undefined) {
                return params.splice(paramsLen, params.length - paramsLen) && ignore;
            }
            for (const v1Element of expression[1]) {
                const _v1 = resolveExpression(v1Element, params, ignore);
                if (_v1 === false) {
                    return params.splice(paramsLen, params.length - paramsLen) && false;
                }
                if (_v1 === true) {
                    if (ignore) {
                        continue;
                    } else {
                        return params.splice(paramsLen, params.length - paramsLen) && false;
                    }
                }
                tokens.push(_v1);
            }
            switch (tokens.length) {
                case 0:
                    return params.splice(paramsLen, params.length - paramsLen) && ignore;
                case 1:
                    return tokens[0];
                default:
                    switch (expression[0]) {
                        case '+':
                            return tokens.join(' + ');
                        case '-':
                            return tokens.join(' - ');
                        case '*':
                            return tokens.join(' * ');
                        case '/':
                            return tokens.join(' / ');
                        case '||':
                            return tokens.join(' || ');
                        case 'and':
                            return `(${tokens.join(' AND ')})`;
                        case 'or':
                            return `(${tokens.join(' OR ')})`;
                    }
            }
            break;
        case '**':
            if (expression[1] === undefined) {
                return params.splice(paramsLen, params.length - paramsLen) && ignore;
            }
            for (const v1Element of expression[1]) {
                const _v1 = resolveExpression(v1Element, params, ignore);
                if (_v1 === false) {
                    return params.splice(paramsLen, params.length - paramsLen) && false;
                }
                if (_v1 === true) {
                    if (ignore) {
                        continue;
                    } else {
                        return params.splice(paramsLen, params.length - paramsLen) && false;
                    }
                }
                tokens.push(_v1);
            }
            switch (tokens.length) {
                case 0:
                    return params.splice(paramsLen, params.length - paramsLen) && ignore;
                case 1:
                    return tokens[0];
                default:
                    const tmp = tokens.pop();
                    tokens.splice(0, 0, 'a');
                    return tokens.join(', power(').substring(3) + `, ${tmp}` + ')'.repeat(tokens.length - 1);
            }
        case 'fun':
            if (expression[1] === undefined || expression[2] === undefined) {
                return params.splice(paramsLen, params.length - paramsLen) && ignore;
            }
            for (const v2Element of expression[2]) {
                const _v2 = resolveExpression(v2Element, params, ignore);
                if (_v2 === false) {
                    return params.splice(paramsLen, params.length - paramsLen) && false;
                }
                if (_v2 === true) {
                    return params.splice(paramsLen, params.length - paramsLen) && ignore;
                }
                tokens.push(_v2);
            }
            return `${expression[1]}(${tokens.join(', ')})${expression[3] ?? ''}`;
        case 'swt':
            if (expression[1] === undefined) {
                return params.splice(paramsLen, params.length - paramsLen) && ignore;
            }
            const {cases = [], otherwise} = expression[1];
            const switchTextArray = ['CASE'];
            for (const caseElement of cases) {
                if (caseElement === undefined) {
                    return params.splice(paramsLen, params.length - paramsLen) && ignore;
                }
                const when = resolveExpression(caseElement.when, params, ignore);
                if (when === false) {
                    return params.splice(paramsLen, params.length - paramsLen) && false;
                }
                if (when === true) {
                    if (ignore) {
                        continue;
                    } else {
                        return params.splice(paramsLen, params.length - paramsLen) && false;
                    }
                }

                const expression = resolveExpression(caseElement.then, params, ignore);
                if (expression === false) {
                    return params.splice(paramsLen, params.length - paramsLen) && false;
                }
                if (expression === true) {
                    if (ignore) {
                        continue;
                    } else {
                        return params.splice(paramsLen, params.length - paramsLen) && false;
                    }
                }

                switchTextArray.push('WHEN', when, 'THEN', expression);
            }
            if (otherwise !== undefined) {
                const expression = resolveExpression(otherwise, params, ignore);
                if (expression === false) {
                    return params.splice(paramsLen, params.length - paramsLen) && false;
                }
                if (expression === true && !ignore) {
                    return params.splice(paramsLen, params.length - paramsLen) && false;
                }
                if (expression !== true) {
                    if (switchTextArray.length === 1) {
                        if (ignore) {
                            return expression;
                        } else {
                            return params.splice(paramsLen, params.length - paramsLen) && false;
                        }
                    }
                    switchTextArray.push('ELSE', expression);
                }
            }
            if (switchTextArray.length === 1) {
                return params.splice(paramsLen, params.length - paramsLen) && ignore;
            }
            switchTextArray.push('END');
            return switchTextArray.join(' ');
        case 'col':
        case 'raw':
            return `${expression[1]}`;
        case '=':
        case '!=':
        case '>':
        case '>=':
        case '<':
        case '<=':
        case 'lk':
        case '@>':
        case '<@':
        case '?':
        case 'j-':
            _e1 = resolveExpression(expression[1], params, ignore);
            _e2 = resolveExpression(expression[2], params, ignore);
            if (_e1 === false || _e2 === false) {
                return params.splice(paramsLen, params.length - paramsLen) && false;
            }
            if (_e1 === true || _e2 === true) {
                return params.splice(paramsLen, params.length - paramsLen) && ignore;
            }
            switch (expression[0]) {
                case '=':
                    return `${_e1} = ${_e2}`;
                case '!=':
                    return `${_e1} <> ${_e2}`;
                case '>':
                    return `${_e1} > ${_e2}`;
                case '>=':
                    return `${_e1} >= ${_e2}`;
                case '<':
                    return `${_e1} < ${_e2}`;
                case '<=':
                    return `${_e1} <= ${_e2}`;
                case 'lk':
                    return `${_e1} LIKE ${_e2}`;
                case '@>':
                    return `${_e1} @> ${_e2}`;
                case '<@':
                    return `${_e1} <@ ${_e2}`;
                case '?':
                    return `${_e1} ? ${_e2}`;
                case 'j-':
                    return `${_e1} - ${_e2}`;
            }
            break;
        case 'in':
        case 'nin':
        case 'lka':
        case 'lks':
        case '?|':
        case '?&':
        case 'j-a':
            _e1 = resolveExpression(expression[1], params, ignore);
            if (_e1 === false) {
                return params.splice(paramsLen, params.length - paramsLen) && false;
            }
            if (_e1 === true) {
                return params.splice(paramsLen, params.length - paramsLen) && ignore;
            }

            if (expression[2] === undefined) {
                return params.splice(paramsLen, params.length - paramsLen) && ignore;
            }
            _e2 = [];
            for (const tmp of expression[2]) {
                const _tmp = resolveExpression(tmp, params, ignore);
                if (_tmp === false) {
                    return params.splice(paramsLen, params.length - paramsLen) && false;
                }
                if (_tmp === true) {
                    if (ignore) {
                        continue;
                    } else {
                        return params.splice(paramsLen, params.length - paramsLen) && false;
                    }
                }
                _e2.push(_tmp);
            }

            switch (_e2.length) {
                case 0:
                    return params.splice(paramsLen, params.length - paramsLen) && ignore;
                case 1:
                    switch (expression[0]) {
                        case 'in':
                            return `${_e1} = ${_e2[0]}`;
                        case 'nin':
                            return `${_e1} <> ${_e2[0]}`;
                        case 'lka':
                            return `${_e1} LIKE ${_e2[0]}`;
                        case 'lks':
                            return `${_e1} LIKE ${_e2[0]}`;
                        case '?|':
                            return `${_e1} ? ${_e2[0]}`;
                        case '?&':
                            return `${_e1} ? ${_e2[0]}`;
                        case 'j-a':
                            return `${_e1} - ${_e2[0]}`;
                    }
                    break;
                default:
                    switch (expression[0]) {
                        case 'in':
                            return `${_e1} IN (${_e2.join(', ')})`;
                        case 'nin':
                            return `${_e1} NOT IN (${_e2.join(', ')})`;
                        case 'lka':
                            return `${_e1} LIKE ALL(ARRAY[${_e2.join(', ')}])`;
                        case 'lks':
                            return `${_e1} LIKE SOME(ARRAY[${_e2.join(', ')}])`;
                        case '?|':
                            return `${_e1} ?| ARRAY[${_e2.join(', ')}]`;
                        case '?&':
                            return `${_e1} ?& ARRAY[${_e2.join(', ')}]`;
                        case 'j-a':
                            return `${_e1} - ARRAY[${_e2.join(', ')}]`;
                    }
            }
            break;
        case 'bt':
            _e1 = resolveExpression(expression[1], params, ignore);
            _e2 = resolveExpression(expression[2], params, ignore);
            _e3 = resolveExpression(expression[3], params, ignore);
            if (_e1 === false || _e2 === false || _e3 === false) {
                return params.splice(paramsLen, params.length - paramsLen) && false;
            }
            if (_e1 === true || _e2 === true || _e3 === true) {
                return params.splice(paramsLen, params.length - paramsLen) && ignore;
            }
            return `${_e1} BETWEEN ${_e2} AND ${_e3}`;
    }
};

const resolveResult = <S extends readonly (keyof E['columns'] | CustomColumn<string>)[] = [], E extends Entity = Entity>(entity: E, rows: any[], columns: S) => {
    rows.forEach((value, i) => {
        for (const column of columns) {
            if (typeof column !== 'object') {
                rows[i][column] = TQ.parse(rows[i][column], entity.columns[column as string].type);
            }
        }
    });
    return rows as { [key in Exclude<keyof S, keyof any[]> as (S[key] extends CustomColumn<infer U> ? U : S[key]) & string]: S[key] extends CustomColumn<any> ? any : PostgresTypeMapper<E['columns'][S[key] & keyof E['columns']]['type'], E['columns'][S[key] & keyof E['columns']]['nullable'], false>; }[];
};

class Wrapper<E extends entity> {
    wrapped(e: E) {
        return TqUtilsBuilder<E>(e);
    }
}

function Select<S extends readonly (keyof E['columns'] | CustomColumn<string>)[] = [], E extends Entity = Entity>
(this: { $: Pool | PoolClient }, entity: E, builder: (tq: ReturnType<Wrapper<E>['wrapped']>) => {
    select: S;
    where?: Expression<boolean>;
    params?: any[];
    order?: [keyof E['columns'], OrderDirection][];
    start?: bigint;
    step?: number;
}, ignoreInWhere: boolean = true) {
    const tq = TqUtilsBuilder(entity);
    const {select, where, params = [], order = [], start, step} = builder(tq);

    // select
    if (select.length === 0) {
        return Promise.reject('no columns selected.');
    }
    const tokens = ['SELECT', resolveSelect(entity, select), 'FROM', `"${entity.schema}"."${entity.title}"`];

    // where
    const _where = resolveExpression(where, params, ignoreInWhere);
    if (_where === false) {
        return Promise.reject('error in where clause');
    }
    tokens.push('WHERE', _where === true ? 'TRUE' : _where);

    // order
    if (order.length !== 0) {
        const ordersTextArray = [];
        for (const orderElement of order) {
            const [by, direction] = orderElement;
            ordersTextArray.push(`${tq.resolveCol(by as string)} ${direction}`);
        }
        tokens.push('ORDER BY', ordersTextArray.join(', '));
    }

    // pagination
    if (start !== undefined) {
        if (start < 0) {
            return Promise.reject('invalid start.');
        }
        tokens.push('OFFSET', start.toString());
    }
    if (step !== undefined) {
        if (step <= 0) {
            return Promise.reject('invalid step.');
        }
        tokens.push('LIMIT', step.toString());
    }

    tokens.push(';');
    return this.$.query(tokens.join(' '), params)
        .then(({rows}) => resolveResult(entity, rows, select));
}

function Insert<C extends readonly (keyof GetNullableColumns<E> & string)[] = [], S extends readonly (keyof E['columns'] | CustomColumn<string>)[] = [], E extends Entity = Entity>
(this: { $: Pool | PoolClient }, entity: E, builder: (tq: ReturnType<Wrapper<E>['wrapped']>) => {
    nullableColumns?: C;
    values: ({ [key in Exclude<keyof E['columns'], keyof GetNullableColumns<E>>]: PostgresTypeMapper<E['columns'][key]['type'], E['columns'][key]['nullable'], E['columns'][key]['default']> } &
        { [key in Exclude<keyof C, keyof any[]> as C[key] & string]: PostgresTypeMapper<E['columns'][C[key] & string]['type'], E['columns'][C[key] & string]['nullable'], E['columns'][C[key] & string]['default']> })[];
    select?: S;
}) {
    const tq = TqUtilsBuilder(entity);
    const {nullableColumns: columns, values, select} = builder(tq);
    const tokens = ['INSERT', 'INTO', `"${entity.schema}"."${entity.title}"`];

    // columns
    const insertingColumns: (keyof E['columns'])[] = [];
    const columnsTextArray = [];
    for (const column in entity.columns) {
        if (!entity.columns[column].nullable || (columns !== undefined && columns.includes(column as any))) {
            insertingColumns.push(column);
            columnsTextArray.push(tq.resolveCol(column, false));
        }
    }
    tokens.push(`(${columnsTextArray.join(', ')})`, 'VALUES');

    // values
    if (values.length === 0) {
        return Promise.reject('values length is zero.');
    }
    const params: any[] = [];
    const valuesTextArray: string[] = [];
    for (const value of values) {
        valuesTextArray.push(`(${insertingColumns.map(e => {
            let v;
            if (value[e as keyof typeof value] === undefined) {
                const column = entity.columns[e as keyof typeof entity.columns];
                switch (column.default) {
                    case true:
                        return tq.stringify(column.value, true);
                    case 'auto-increment':
                        return 'DEFAULT';
                    case 'created-at':
                    case 'updated-at':
                        return tq.stringify(new Date(), true);
                    case false:
                        throw 'do not expect this.';
                }
            } else {
                v = tq.stringify(value[e], false);
            }
            return `$${params.push(v)}`;
        }).join(', ')})`);
    }
    tokens.push(valuesTextArray.join(', '));

    // returning
    if (select !== undefined && select.length !== 0) {
        tokens.push('RETURNING', resolveSelect(entity, select));
    }

    tokens.push(';');
    return this.$.query(tokens.join(' '), params)
        .then(({rows}) => select === undefined ? [] : resolveResult(entity, rows, select));
}

function InsertExpression<C extends readonly (keyof GetNullableColumns<E> & string)[] = [], S extends readonly (keyof E['columns'] | CustomColumn<string>)[] = [], E extends Entity = Entity>
(this: { $: Pool | PoolClient }, entity: E, builder: (tq: ReturnType<Wrapper<E>['wrapped']>) => {
    nullableColumns?: C;
    values: ({ [key in Exclude<keyof E['columns'], keyof GetNullableColumns<E>>]: Expression<PostgresTypeMapper<E['columns'][key]['type'], E['columns'][key]['nullable'], E['columns'][key]['default']>> } &
        { [key in Exclude<keyof C, keyof any[]> as C[key] & string]: Expression<PostgresTypeMapper<E['columns'][C[key] & string]['type'], E['columns'][C[key] & string]['nullable'], E['columns'][C[key] & string]['default']>> })[];
    select?: S;
}, ignoreInValues: boolean = true) {
    const tq = TqUtilsBuilder(entity);
    const {nullableColumns: columns, values, select} = builder(tq);
    const tokens = ['INSERT', 'INTO', `"${entity.schema}"."${entity.title}"`];

    // columns
    const insertingColumns: (keyof E['columns'])[] = [];
    const columnsTextArray = [];
    for (const column in entity.columns) {
        if (!entity.columns[column].nullable || (columns !== undefined && columns.includes(column as any))) {
            insertingColumns.push(column);
            columnsTextArray.push(tq.resolveCol(column, false));
        }
    }
    tokens.push(`(${columnsTextArray.join(', ')})`, 'VALUES');

    // values
    if (values.length === 0) {
        return Promise.reject('values length is zero.');
    }
    const params: any[] = [];
    const valuesTextArray: string[] = [];
    for (const value of values) {
        valuesTextArray.push(`(${insertingColumns.map(e => {
            if (value[e as keyof typeof value] === undefined) {
                const column = entity.columns[e as keyof typeof entity.columns];
                switch (column.default) {
                    case true:
                        return tq.stringify(column.value, false);
                    case 'auto-increment':
                        return 'DEFAULT';
                    case 'created-at':
                    case 'updated-at':
                        return tq.stringify(new Date(), false);
                    case false:
                        throw 'do not expect this.';
                }
            } else {
                const resolvedExpression = resolveExpression(value[e], params, ignoreInValues);
                if (resolvedExpression === false || resolvedExpression === true) {
                    throw 'invalid value';
                }
                return resolvedExpression;
            }
        }).join(', ')})`);
    }
    tokens.push(valuesTextArray.join(', '));

    // returning
    if (select !== undefined && select.length !== 0) {
        tokens.push('RETURNING', resolveSelect(entity, select));
    }

    tokens.push(';');
    return this.$.query(tokens.join(' '), params)
        .then(({rows}) => select === undefined ? [] : resolveResult(entity, rows, select));
}

function Update<S extends readonly (keyof E['columns'] | CustomColumn<string>)[] = [], E extends Entity = Entity>
(this: { $: Pool | PoolClient }, entity: E, builder: (tq: ReturnType<Wrapper<E>['wrapped']>) => {
    sets: { [key in keyof E['columns']]?: PostgresTypeMapper<E['columns'][key]['type'], E['columns'][key]['nullable'], E['columns'][key]['default']>; };
    where?: Expression<boolean>;
    select?: S;
    params?: any[];
}, ignoreInWhere: boolean = true) {
    const tq = TqUtilsBuilder(entity);
    const {sets, where, select, params = []} = builder(tq);
    const tokens = ['UPDATE', `"${entity.schema}"."${entity.title}"`, 'SET'];

    // set
    if (Object.keys(sets).length === 0) {
        return Promise.reject('no set clause found.');
    }
    const setsTextArray = [];
    let key: keyof typeof sets;
    for (key in sets) {
        setsTextArray.push([tq.resolveCol(key as string, false), '=', `$${params.push(tq.stringify(sets[key]!))}`].join(' '));
    }
    for (const column in entity.columns) {
        switch (entity.columns[column].default) {
            case "updated-at":
                setsTextArray.push([tq.resolveCol(column, false), '=', tq.stringify(new Date(), true)].join(' '));
                break;
        }
    }
    tokens.push(setsTextArray.join(', '));

    // where
    const _where = resolveExpression(where, params, ignoreInWhere);
    if (_where === false) {
        return Promise.reject('error in where clause.');
    }
    tokens.push('WHERE', _where === true ? 'FALSE' : _where);

    // returning
    if (select !== undefined && select.length !== 0) {
        tokens.push('RETURNING', resolveSelect(entity, select));
    }

    tokens.push(';');
    return this.$.query(tokens.join(' '), params)
        .then(({rows}) => select === undefined ? [] : resolveResult(entity, rows, select));
}

function UpdateExpression<S extends readonly (keyof E['columns'] | CustomColumn<string>)[] = [], E extends Entity = Entity>
(this: { $: Pool | PoolClient }, entity: E, builder: (tq: ReturnType<Wrapper<E>['wrapped']>) => {
    sets: { [key in keyof E['columns']]?: Expression<PostgresTypeMapper<E['columns'][key]['type'], E['columns'][key]['nullable'], E['columns'][key]['default']>>; };
    where?: Expression<boolean>;
    select?: S;
    params?: any[];
}, ignoreInSets: boolean = true, ignoreInWhere: boolean = true) {
    const tq = TqUtilsBuilder(entity);
    const {sets, where, select, params = []} = builder(tq);
    const tokens = ['UPDATE', `"${entity.schema}"."${entity.title}"`, 'SET'];

    // set
    if (Object.keys(sets).length === 0) {
        return Promise.reject('no set clause found.');
    }
    const setsTextArray = [];
    let key: keyof typeof sets;
    for (key in sets) {
        const expression = resolveExpression(sets[key]!, params, ignoreInSets);
        if (expression === false) {
            return Promise.reject('error in set clause.');
        }
        if (expression === true) {
            continue;
        }
        setsTextArray.push([tq.resolveCol(key as string, false), '=', expression].join(' '));
    }
    for (const column in entity.columns) {
        switch (entity.columns[column].default) {
            case "updated-at":
                setsTextArray.push([tq.resolveCol(column, false), '=', tq.stringify(new Date(), true)].join(' '));
                break;
        }
    }
    tokens.push(setsTextArray.join(', '));

    // where
    const _where = resolveExpression(where, params, ignoreInWhere);
    if (_where === false) {
        return Promise.reject('error in where clause.');
    }
    tokens.push('WHERE', _where === true ? 'FALSE' : _where);

    // returning
    if (select !== undefined && select.length !== 0) {
        tokens.push('RETURNING', resolveSelect(entity, select));
    }

    tokens.push(';');
    return this.$.query(tokens.join(' '), params)
        .then(({rows}) => select === undefined ? [] : resolveResult(entity, rows, select));
}

function Delete<S extends readonly (keyof E['columns'] | CustomColumn<string>)[] = [], E extends Entity = Entity>
(this: { $: Pool | PoolClient }, entity: E, builder: (tq: ReturnType<Wrapper<E>['wrapped']>) => {
    where?: Expression<boolean>;
    select?: S;
    params?: any[];
}, ignoreInWhere: boolean = true) {
    const {where, select, params = []} = builder(TqUtilsBuilder(entity));
    const tokens = ['DELETE', 'FROM', `"${entity.schema}"."${entity.title}"`];

    // where
    const _where = resolveExpression(where, params, ignoreInWhere);
    if (_where === false) {
        return Promise.reject('error in where clause.');
    }
    tokens.push('WHERE', _where === true ? 'FALSE' : _where);

    // returning
    if (select !== undefined && select.length !== 0) {
        tokens.push('RETURNING', resolveSelect(entity, select));
    }

    tokens.push(';');
    return this.$.query(tokens.join(' '), params)
        .then(({rows}) => select === undefined ? [] : resolveResult(entity, rows, select));
}

export {resolveExpression};
export {Select, Insert, InsertExpression, Update, UpdateExpression, Delete};