import {TQ} from '../Utils';
import {resolveExpression} from '../Query';

const IGNORE_FALSE = false;
const IGNORE_TRUE = true;
const User = {
    code: 1,
    schema: 'public',
    title: 'user',
    columns: {
        id: {
            type: 'smallint',
            default: 'auto-increment',
            nullable: false
        },
        title: {
            type: 'varchar',
            length: 200,
            default: false,
            nullable: false
        }
    }
} as const;

describe('ignore-false', () => {
    const simpleOperator = (op: '+' | '-' | '*' | '/') => {
        const fun = op === '+' ? TQ.plus : op === '-' ? TQ.minus : op === '*' ? TQ.multi : op === '/' ? TQ.divide : undefined;

        test('undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(fun!(undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('empty-array', () => {
            const params: any[] = [];
            const result = resolveExpression(fun!([]), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-array', () => {
            const params: any[] = [];
            const result = resolveExpression(fun!([undefined]), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('single-item-array', () => {
            const params: any[] = [];
            const result = resolveExpression(fun!([TQ.val(12)]), params, IGNORE_FALSE);
            expect(result).toBe('$1');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(1);
            expect(params[0]).toBe(12);
        });
        test('single-item-array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(fun!([TQ.val(12), undefined]), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('array', () => {
            const params: any[] = [];
            const result = resolveExpression(fun!([TQ.val(12), TQ.val(10)]), params, IGNORE_FALSE);
            expect(result).toBe(`$1 ${op} $2`);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe(12);
            expect(params[1]).toBe(10);
        });
        test('array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(fun!([TQ.val(12), undefined, TQ.val(10), undefined]), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
    };
    const andOrTest = (op: 'AND' | 'OR') => {
        const fun = op === 'AND' ? TQ.andScope : op === 'OR' ? TQ.orScope : undefined;

        test('undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(fun!(undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('empty', () => {
            const params: any[] = [];
            const result = resolveExpression(fun!([]), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('array-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(fun!([undefined]), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(fun!([TQ.eqOp(TQ.val(12), TQ.val(13)), undefined]), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('array-1', () => {
            const params: any[] = [];
            const result = resolveExpression(fun!([TQ.eqOp(TQ.val(12), TQ.val(13))]), params, IGNORE_FALSE);
            expect(result).toBe(`$1 = $2`);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe(12);
            expect(params[1]).toBe(13);
        });
        test('array-2', () => {
            const params: any[] = [];
            const result = resolveExpression(fun!([TQ.eqOp(TQ.val(12), TQ.val(13)), TQ.gOp(TQ.val(14), TQ.val(15))]), params, IGNORE_FALSE);
            expect(result).toBe(`($1 = $2 ${op} $3 > $4)`);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(4);
            expect(params[0]).toBe(12);
            expect(params[1]).toBe(13);
            expect(params[2]).toBe(14);
            expect(params[3]).toBe(15);
        });
        test('array-3', () => {
            const params: any[] = [];
            const result = resolveExpression(fun!([
                TQ.eqOp(TQ.val(12), TQ.val(13)),
                TQ.gOp(TQ.val(14), TQ.val(15)),
                TQ.lEqOp(TQ.val(16), TQ.val(17))]), params, IGNORE_FALSE);
            expect(result).toBe(`($1 = $2 ${op} $3 > $4 ${op} $5 <= $6)`);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(6);
            expect(params[0]).toBe(12);
            expect(params[1]).toBe(13);
            expect(params[2]).toBe(14);
            expect(params[3]).toBe(15);
            expect(params[4]).toBe(16);
            expect(params[5]).toBe(17);
        });
    };

    test('undefined', () => {
        const params: any[] = [];
        const result = resolveExpression(undefined, params, IGNORE_FALSE);
        expect(result).toBe(false);
        expect(Array.isArray(params)).toBe(true);
        expect(params).toHaveLength(0);
    });

    describe('val', () => {
        test('undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(undefined, params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('boolean', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.val(false), params, IGNORE_FALSE);
            expect(result).toBe('$1');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(1);
            expect(params[0]).toBe('FALSE');
        });
        test('number', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.val(10), params, IGNORE_FALSE);
            expect(result).toBe('$1');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(1);
            expect(params[0]).toBe(10);
        });
        test('string', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.val('hello'), params, IGNORE_FALSE);
            expect(result).toBe('$1');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(1);
            expect(params[0]).toBe('hello');
        });
    });
    test('not', () => {
        const params: any[] = [];
        const result = resolveExpression(TQ.not(TQ.val(false)), params, IGNORE_FALSE);
        expect(result).toBe('NOT $1');
        expect(Array.isArray(params)).toBe(true);
        expect(params).toHaveLength(1);
        expect(params[0]).toBe('FALSE');
    });
    describe('plus', () => {
        simpleOperator('+');
    });
    describe('minus', () => {
        simpleOperator('-');
    });
    describe('multi', () => {
        simpleOperator('*');
    });
    describe('divide', () => {
        simpleOperator('/');
    });
    describe('concat', () => {
        test('undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.con(undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('empty-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.con([]), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.con([undefined]), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('single-item-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.con([TQ.val('a')]), params, IGNORE_FALSE);
            expect(result).toBe('$1');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(1);
            expect(params[0]).toBe('a');
        });
        test('single-item-array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.con([TQ.val('a'), undefined]), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.con([TQ.val('a'), TQ.val('b')]), params, IGNORE_FALSE);
            expect(result).toBe('$1 || $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
        test('array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.con([TQ.val('a'), undefined, TQ.val('b'), undefined]), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
    });
    describe('power', () => {
        test('undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.plus(undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('empty-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.pow([]), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.pow([undefined]), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('single-item-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.pow([TQ.val(12)]), params, IGNORE_FALSE);
            expect(result).toBe('$1');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(1);
            expect(params[0]).toBe(12);
        });
        test('single-item-array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.pow([TQ.val(12), undefined]), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.pow([TQ.val(12), TQ.val(10)]), params, IGNORE_FALSE);
            expect(result).toBe(`power($1, $2)`);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe(12);
            expect(params[1]).toBe(10);
        });
        test('array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.pow([TQ.val(12), undefined, TQ.val(10), undefined]), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
    });
    describe('function', () => {
        test('name-undefined-args-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.fun(undefined, undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('name-undefined-args-empty', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.fun(undefined, []), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('name-undefined-args-array-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.fun(undefined, [undefined]), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('name-undefined-args-array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.fun(undefined, [TQ.val(12), undefined]), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('args-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.fun('substr', undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('args-empty', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.fun('substr', []), params, IGNORE_FALSE);
            expect(result).toBe('substr()');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('args-array-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.fun('substr', [undefined]), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('args-array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.fun('substr', [TQ.val(12), undefined]), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('single-arg', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.fun('substr', [TQ.val(12)]), params, IGNORE_FALSE);
            expect(result).toBe('substr($1)');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(1);
            expect(params[0]).toBe(12);
        });
        test('multi-arg', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.fun('substr', [TQ.val(12), TQ.val('hello')]), params, IGNORE_FALSE);
            expect(result).toBe('substr($1, $2)');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe(12);
            expect(params[1]).toBe('hello');
        });
    });
    describe('switch', () => {
        test('undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.swt(undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('empty-object', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.swt({}), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('cases-empty-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.swt({cases: []}), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('cases-undefined-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.swt({cases: [undefined]}), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('single-case', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.swt({
                cases: [
                    {when: TQ.eqOp(TQ.val(10), TQ.val(10)), then: TQ.val(12)}
                ]
            }), params, IGNORE_FALSE);
            expect(result).toBe('CASE WHEN $1 = $2 THEN $3 END');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(3);
            expect(params[0]).toBe(10);
            expect(params[1]).toBe(10);
            expect(params[2]).toBe(12);
        });
        test('multi-cases', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.swt({
                cases: [
                    {when: TQ.eqOp(TQ.val(10), TQ.val(10)), then: TQ.val(12)},
                    {when: TQ.eqOp(TQ.val('a'), TQ.val('a')), then: TQ.val(15)},
                ]
            }), params, IGNORE_FALSE);
            expect(result).toBe('CASE WHEN $1 = $2 THEN $3 WHEN $4 = $5 THEN $6 END');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(6);
            expect(params[0]).toBe(10);
            expect(params[1]).toBe(10);
            expect(params[2]).toBe(12);
            expect(params[3]).toBe('a');
            expect(params[4]).toBe('a');
            expect(params[5]).toBe(15);
        });
        test('single-case-otherwise', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.swt({
                cases: [
                    {when: TQ.eqOp(TQ.val(10), TQ.val(10)), then: TQ.val(12)}
                ],
                otherwise: TQ.val(17)
            }), params, IGNORE_FALSE);
            expect(result).toBe('CASE WHEN $1 = $2 THEN $3 ELSE $4 END');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(4);
            expect(params[0]).toBe(10);
            expect(params[1]).toBe(10);
            expect(params[2]).toBe(12);
            expect(params[3]).toBe(17);
        });
        test('multi-cases-otherwise', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.swt({
                cases: [
                    {when: TQ.eqOp(TQ.val(10), TQ.val(10)), then: TQ.val(12)},
                    {when: TQ.eqOp(TQ.val('a'), TQ.val('a')), then: TQ.val(15)},
                ],
                otherwise: TQ.val(17)
            }), params, IGNORE_FALSE);
            expect(result).toBe('CASE WHEN $1 = $2 THEN $3 WHEN $4 = $5 THEN $6 ELSE $7 END');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(7);
            expect(params[0]).toBe(10);
            expect(params[1]).toBe(10);
            expect(params[2]).toBe(12);
            expect(params[3]).toBe('a');
            expect(params[4]).toBe('a');
            expect(params[5]).toBe(15);
            expect(params[6]).toBe(17);
        });
        test('otherwise', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.swt({otherwise: TQ.val(17)}), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
    });
    test('column', () => {
        const params: any[] = [];
        const result = resolveExpression(TQ.col('title', User), params, IGNORE_FALSE);
        expect(result).toBe('"public"."user"."title"');
        expect(Array.isArray(params)).toBe(true);
        expect(params).toHaveLength(0);
    });
    test('raw', () => {
        const params: any[] = [];
        const result = resolveExpression(TQ.raw('blah blah!'), params, IGNORE_FALSE);
        expect(result).toBe('blah blah!');
        expect(Array.isArray(params)).toBe(true);
        expect(params).toHaveLength(0);
    });

    // scope
    describe('not', () => {
        test('undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.notScope(undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('simple', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.notScope(TQ.eqOp(TQ.val(12), TQ.val(13))), params, IGNORE_FALSE);
            expect(result).toBe('NOT ($1 = $2)');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe(12);
            expect(params[1]).toBe(13);
        });
    });
    describe('and', () => {
        andOrTest('AND');
    });
    describe('or', () => {
        andOrTest('OR');
    });

    // operator
    describe('is-null', () => {
        test('undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.isNullOp(undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        })
        test('simple', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.isNullOp(TQ.val(null)), params, IGNORE_FALSE);
            expect(result).toBe('$1 IS NULL');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(1);
            expect(params[0]).toBe('NULL');
        });
    });
    describe('is-not-null', () => {
        test('undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.isNotNullOp(undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        })
        test('simple', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.isNotNullOp(TQ.val(null)), params, IGNORE_FALSE);
            expect(result).toBe('$1 IS NOT NULL');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(1);
            expect(params[0]).toBe('NULL');
        });
    });
    describe('equal', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.eqOp(undefined, undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.eqOp(undefined, TQ.val('a')), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.eqOp(TQ.val('a'), undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('string', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.eqOp(TQ.val('a'), TQ.val('b')), params, IGNORE_FALSE);
            expect(result).toBe('$1 = $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
    });
    describe('not-equal', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.notEqOp(undefined, undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.notEqOp(undefined, TQ.val('a')), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.notEqOp(TQ.val('a'), undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('string', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.notEqOp(TQ.val('a'), TQ.val('b')), params, IGNORE_FALSE);
            expect(result).toBe('$1 <> $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
    });
    describe('greater', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.gOp(undefined, undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.gOp(undefined, TQ.val('a')), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.gOp(TQ.val('a'), undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('string', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.gOp(TQ.val('a'), TQ.val('b')), params, IGNORE_FALSE);
            expect(result).toBe('$1 > $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
    });
    describe('greater-or-equal', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.gEqOp(undefined, undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.gEqOp(undefined, TQ.val('a')), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.gEqOp(TQ.val('a'), undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('string', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.gEqOp(TQ.val('a'), TQ.val('b')), params, IGNORE_FALSE);
            expect(result).toBe('$1 >= $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
    });
    describe('less-than', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lOp(undefined, undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lOp(undefined, TQ.val('a')), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lOp(TQ.val('a'), undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('string', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lOp(TQ.val('a'), TQ.val('b')), params, IGNORE_FALSE);
            expect(result).toBe('$1 < $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
    });
    describe('less-than-or-equal', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lEqOp(undefined, undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lEqOp(undefined, TQ.val('a')), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lEqOp(TQ.val('a'), undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('string', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lEqOp(TQ.val('a'), TQ.val('b')), params, IGNORE_FALSE);
            expect(result).toBe('$1 <= $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
    });
    describe('like', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lkOp(undefined, undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lkOp(undefined, TQ.val('a')), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lkOp(TQ.val('a'), undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('string', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lkOp(TQ.val('a'), TQ.val('b')), params, IGNORE_FALSE);
            expect(result).toBe('$1 LIKE $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
    });
    describe('in', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.inOp(undefined, undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.inOp(undefined, []), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.inOp(TQ.val('a'), undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('single-item-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.inOp(TQ.val('a'), [TQ.val('b')]), params, IGNORE_FALSE);
            expect(result).toBe('$1 = $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
        test('array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.inOp(TQ.val('a'), [TQ.val('b'), undefined]), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('multi-items-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.inOp(TQ.val('a'), [TQ.val('b'), TQ.val('c')]), params, IGNORE_FALSE);
            expect(result).toBe('$1 IN ($2, $3)');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(3);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
            expect(params[2]).toBe('c');
        });
    });
    describe('not-in', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.notInOp(undefined, undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.notInOp(undefined, []), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.notInOp(TQ.val('a'), undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('single-item-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.notInOp(TQ.val('a'), [TQ.val('b')]), params, IGNORE_FALSE);
            expect(result).toBe('$1 <> $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
        test('array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.notInOp(TQ.val('a'), [TQ.val('b'), undefined]), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('multi-items-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.notInOp(TQ.val('a'), [TQ.val('b'), TQ.val('c')]), params, IGNORE_FALSE);
            expect(result).toBe('$1 NOT IN ($2, $3)');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(3);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
            expect(params[2]).toBe('c');
        });
    });
    describe('like-all', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lkaOp(undefined, undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lkaOp(undefined, []), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lkaOp(TQ.val('a'), undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('single-item-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lkaOp(TQ.val('a'), [TQ.val('b')]), params, IGNORE_FALSE);
            expect(result).toBe('$1 LIKE $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
        test('array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lkaOp(TQ.val('a'), [TQ.val('b'), undefined]), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('multi-items-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lkaOp(TQ.val('a'), [TQ.val('b'), TQ.val('c')]), params, IGNORE_FALSE);
            expect(result).toBe('$1 LIKE ALL(ARRAY[$2, $3])');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(3);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
            expect(params[2]).toBe('c');
        });
    });
    describe('like-some', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lksOp(undefined, undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lksOp(undefined, []), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lksOp(TQ.val('a'), undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('single-item-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lksOp(TQ.val('a'), [TQ.val('b')]), params, IGNORE_FALSE);
            expect(result).toBe('$1 LIKE $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
        test('array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lksOp(TQ.val('a'), [TQ.val('b'), undefined]), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('multi-items-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lksOp(TQ.val('a'), [TQ.val('b'), TQ.val('c')]), params, IGNORE_FALSE);
            expect(result).toBe('$1 LIKE SOME(ARRAY[$2, $3])');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(3);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
            expect(params[2]).toBe('c');
        });
    });
    describe('between', () => {
        test('undefined-1-2-3', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.btOp(undefined, undefined, undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1-3', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.btOp(undefined, TQ.val(12), undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.btOp(undefined, undefined, TQ.val(12)), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-3', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.btOp(TQ.val(12), TQ.val(12), undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.btOp(TQ.val(12), undefined, TQ.val(12)), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.btOp(undefined, TQ.val(12), TQ.val(12)), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('number', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.btOp(TQ.val(1), TQ.val(2), TQ.val(3)), params, IGNORE_FALSE);
            expect(result).toBe('$1 BETWEEN $2 AND $3');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(3);
            expect(params[0]).toBe(1);
            expect(params[1]).toBe(2);
            expect(params[2]).toBe(3);
        });
    });
    describe('json-@>', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jAtROp(undefined, undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jAtROp(undefined, TQ.val(['a'])), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jAtROp(TQ.val(['a']), undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('string', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jAtROp(TQ.val(['a']), TQ.val(['b'])), params, IGNORE_FALSE);
            expect(result).toBe('$1 @> $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('["a"]');
            expect(params[1]).toBe('["b"]');
        });
    });
    describe('json-<@', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jAtLOp(undefined, undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jAtLOp(undefined, TQ.val(['a'])), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jAtLOp(TQ.val(['a']), undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('string', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jAtLOp(TQ.val(['a']), TQ.val(['b'])), params, IGNORE_FALSE);
            expect(result).toBe('$1 <@ $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('["a"]');
            expect(params[1]).toBe('["b"]');
        });
    });
    describe('json-?', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jIsOp(undefined, undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jIsOp(undefined, TQ.val('a')), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jIsOp(TQ.val(['a']), undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('string', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jIsOp(TQ.val(['a']), TQ.val('b')), params, IGNORE_FALSE);
            expect(result).toBe('$1 ? $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('["a"]');
            expect(params[1]).toBe('b');
        });
    });
    describe('json-?|', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jOrOp(undefined, undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jOrOp(undefined, [TQ.val('a')]), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jOrOp(TQ.val(['a']), undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('single-item-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jOrOp(TQ.val(['a']), [TQ.val('b')]), params, IGNORE_FALSE);
            expect(result).toBe('$1 ? $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('["a"]');
            expect(params[1]).toBe('b');
        });
        test('array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jOrOp(TQ.val(['a']), [TQ.val('b'), undefined]), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('multi-items-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jOrOp(TQ.val(['a']), [TQ.val('b'), TQ.val('c')]), params, IGNORE_FALSE);
            expect(result).toBe('$1 ?| ARRAY[$2, $3]');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(3);
            expect(params[0]).toBe('["a"]');
            expect(params[1]).toBe('b');
            expect(params[2]).toBe('c');
        });
    });
    describe('json-?&', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jAndOp(undefined, undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jAndOp(undefined, [TQ.val('a')]), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jAndOp(TQ.val(['a']), undefined), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('single-item-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jAndOp(TQ.val(['a']), [TQ.val('b')]), params, IGNORE_FALSE);
            expect(result).toBe('$1 ? $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('["a"]');
            expect(params[1]).toBe('b');
        });
        test('array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jAndOp(TQ.val(['a']), [TQ.val('b'), undefined]), params, IGNORE_FALSE);
            expect(result).toBe(false);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('multi-items-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jAndOp(TQ.val(['a']), [TQ.val('b'), TQ.val('c')]), params, IGNORE_FALSE);
            expect(result).toBe('$1 ?& ARRAY[$2, $3]');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(3);
            expect(params[0]).toBe('["a"]');
            expect(params[1]).toBe('b');
            expect(params[2]).toBe('c');
        });
    });
});

describe('ignore-true', () => {
    const simpleOperator = (op: '+' | '-' | '*' | '/') => {
        const fun = op === '+' ? TQ.plus : op === '-' ? TQ.minus : op === '*' ? TQ.multi : op === '/' ? TQ.divide : undefined;

        test('undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(fun!(undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('empty-array', () => {
            const params: any[] = [];
            const result = resolveExpression(fun!([]), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-array', () => {
            const params: any[] = [];
            const result = resolveExpression(fun!([undefined]), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('single-item-array', () => {
            const params: any[] = [];
            const result = resolveExpression(fun!([TQ.val(12)]), params, IGNORE_TRUE);
            expect(result).toBe('$1');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(1);
            expect(params[0]).toBe(12);
        });
        test('single-item-array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(fun!([TQ.val(12), undefined]), params, IGNORE_TRUE);
            expect(result).toBe('$1');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(1);
            expect(params[0]).toBe(12);
        });
        test('array', () => {
            const params: any[] = [];
            const result = resolveExpression(fun!([TQ.val(12), TQ.val(10)]), params, IGNORE_TRUE);
            expect(result).toBe(`$1 ${op} $2`);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe(12);
            expect(params[1]).toBe(10);
        });
        test('array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(fun!([TQ.val(12), undefined, TQ.val(10), undefined]), params, IGNORE_TRUE);
            expect(result).toBe(`$1 ${op} $2`);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe(12);
            expect(params[1]).toBe(10);
        });
    };
    const andOrTest = (op: 'AND' | 'OR') => {
        const fun = op === 'AND' ? TQ.andScope : op === 'OR' ? TQ.orScope : undefined;

        test('undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(fun!(undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('empty', () => {
            const params: any[] = [];
            const result = resolveExpression(fun!([]), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('array-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(fun!([undefined]), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(fun!([undefined, TQ.eqOp(TQ.val(12), TQ.val(13)), undefined]), params, IGNORE_TRUE);
            expect(result).toBe(`$1 = $2`);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe(12);
            expect(params[1]).toBe(13);
        });
        test('array-1', () => {
            const params: any[] = [];
            const result = resolveExpression(fun!([TQ.eqOp(TQ.val(12), TQ.val(13))]), params, IGNORE_TRUE);
            expect(result).toBe(`$1 = $2`);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe(12);
            expect(params[1]).toBe(13);
        });
        test('array-2', () => {
            const params: any[] = [];
            const result = resolveExpression(fun!([TQ.eqOp(TQ.val(12), TQ.val(13)), TQ.gOp(TQ.val(14), TQ.val(15))]), params, IGNORE_TRUE);
            expect(result).toBe(`($1 = $2 ${op} $3 > $4)`);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(4);
            expect(params[0]).toBe(12);
            expect(params[1]).toBe(13);
            expect(params[2]).toBe(14);
            expect(params[3]).toBe(15);
        });
        test('array-3', () => {
            const params: any[] = [];
            const result = resolveExpression(fun!([
                TQ.eqOp(TQ.val(12), TQ.val(13)),
                TQ.gOp(TQ.val(14), TQ.val(15)),
                TQ.lEqOp(TQ.val(16), TQ.val(17))]), params, IGNORE_TRUE);
            expect(result).toBe(`($1 = $2 ${op} $3 > $4 ${op} $5 <= $6)`);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(6);
            expect(params[0]).toBe(12);
            expect(params[1]).toBe(13);
            expect(params[2]).toBe(14);
            expect(params[3]).toBe(15);
            expect(params[4]).toBe(16);
            expect(params[5]).toBe(17);
        });
    };

    test('undefined', () => {
        const params: any[] = [];
        const result = resolveExpression(undefined, params, IGNORE_TRUE);
        expect(result).toBe(true);
        expect(Array.isArray(params)).toBe(true);
        expect(params).toHaveLength(0);
    });

    describe('val', () => {
        test('undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(undefined, params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('boolean', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.val(false), params, IGNORE_TRUE);
            expect(result).toBe('$1');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(1);
            expect(params[0]).toBe('FALSE');
        });
        test('number', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.val(10), params, IGNORE_TRUE);
            expect(result).toBe('$1');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(1);
            expect(params[0]).toBe(10);
        });
        test('string', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.val('hello'), params, IGNORE_TRUE);
            expect(result).toBe('$1');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(1);
            expect(params[0]).toBe('hello');
        });
    });
    test('not', () => {
        const params: any[] = [];
        const result = resolveExpression(TQ.not(TQ.val(false)), params, IGNORE_TRUE);
        expect(result).toBe('NOT $1');
        expect(Array.isArray(params)).toBe(true);
        expect(params).toHaveLength(1);
        expect(params[0]).toBe('FALSE');
    });
    describe('plus', () => {
        simpleOperator('+');
    });
    describe('minus', () => {
        simpleOperator('-');
    });
    describe('multi', () => {
        simpleOperator('*');
    });
    describe('divide', () => {
        simpleOperator('/');
    });
    describe('concat', () => {
        test('undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.con(undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('empty-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.con([]), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.con([undefined]), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('single-item-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.con([TQ.val('a')]), params, IGNORE_TRUE);
            expect(result).toBe('$1');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(1);
            expect(params[0]).toBe('a');
        });
        test('single-item-array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.con([TQ.val('a'), undefined]), params, IGNORE_TRUE);
            expect(result).toBe('$1');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(1);
            expect(params[0]).toBe('a');
        });
        test('array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.con([TQ.val('a'), TQ.val('b')]), params, IGNORE_TRUE);
            expect(result).toBe('$1 || $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
        test('array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.con([TQ.val('a'), undefined, TQ.val('b'), undefined]), params, IGNORE_TRUE);
            expect(result).toBe('$1 || $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
    });
    describe('power', () => {
        test('undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.plus(undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('empty-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.pow([]), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.pow([undefined]), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('single-item-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.pow([TQ.val(12)]), params, IGNORE_TRUE);
            expect(result).toBe('$1');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(1);
            expect(params[0]).toBe(12);
        });
        test('single-item-array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.pow([TQ.val(12), undefined]), params, IGNORE_TRUE);
            expect(result).toBe('$1');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(1);
            expect(params[0]).toBe(12);
        });
        test('array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.pow([TQ.val(12), TQ.val(10)]), params, IGNORE_TRUE);
            expect(result).toBe('power($1, $2)');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe(12);
            expect(params[1]).toBe(10);
        });
        test('array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.pow([TQ.val(12), undefined, TQ.val(10), undefined]), params, IGNORE_TRUE);
            expect(result).toBe('power($1, $2)');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe(12);
            expect(params[1]).toBe(10);
        });
    });
    describe('function', () => {
        test('name-undefined-args-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.fun(undefined, undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('name-undefined-args-empty', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.fun(undefined, []), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('name-undefined-args-array-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.fun(undefined, [undefined]), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('name-undefined-args-array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.fun(undefined, [TQ.val(12), undefined]), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('args-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.fun('substr', undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('args-empty', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.fun('substr', []), params, IGNORE_TRUE);
            expect(result).toBe('substr()');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('args-array-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.fun('substr', [undefined]), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('args-array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.fun('substr', [TQ.val(12), undefined]), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('single-arg', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.fun('substr', [TQ.val(12)]), params, IGNORE_TRUE);
            expect(result).toBe('substr($1)');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(1);
            expect(params[0]).toBe(12);
        });
        test('multi-arg', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.fun('substr', [TQ.val(12), TQ.val('hello')]), params, IGNORE_TRUE);
            expect(result).toBe('substr($1, $2)');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe(12);
            expect(params[1]).toBe('hello');
        });
    });
    describe('switch', () => {
        test('undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.swt(undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('empty-object', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.swt({}), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('cases-empty-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.swt({cases: []}), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('cases-undefined-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.swt({cases: [undefined]}), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('single-case', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.swt({
                cases: [
                    {when: TQ.eqOp(TQ.val(10), TQ.val(10)), then: TQ.val(12)}
                ]
            }), params, IGNORE_TRUE);
            expect(result).toBe('CASE WHEN $1 = $2 THEN $3 END');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(3);
            expect(params[0]).toBe(10);
            expect(params[1]).toBe(10);
            expect(params[2]).toBe(12);
        });
        test('multi-cases', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.swt({
                cases: [
                    {when: TQ.eqOp(TQ.val(10), TQ.val(10)), then: TQ.val(12)},
                    {when: TQ.eqOp(TQ.val('a'), TQ.val('a')), then: TQ.val(15)},
                ]
            }), params, IGNORE_TRUE);
            expect(result).toBe('CASE WHEN $1 = $2 THEN $3 WHEN $4 = $5 THEN $6 END');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(6);
            expect(params[0]).toBe(10);
            expect(params[1]).toBe(10);
            expect(params[2]).toBe(12);
            expect(params[3]).toBe('a');
            expect(params[4]).toBe('a');
            expect(params[5]).toBe(15);
        });
        test('single-case-otherwise', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.swt({
                cases: [
                    {when: TQ.eqOp(TQ.val(10), TQ.val(10)), then: TQ.val(12)}
                ],
                otherwise: TQ.val(17)
            }), params, IGNORE_TRUE);
            expect(result).toBe('CASE WHEN $1 = $2 THEN $3 ELSE $4 END');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(4);
            expect(params[0]).toBe(10);
            expect(params[1]).toBe(10);
            expect(params[2]).toBe(12);
            expect(params[3]).toBe(17);
        });
        test('multi-cases-otherwise', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.swt({
                cases: [
                    {when: TQ.eqOp(TQ.val(10), TQ.val(10)), then: TQ.val(12)},
                    {when: TQ.eqOp(TQ.val('a'), TQ.val('a')), then: TQ.val(15)},
                ],
                otherwise: TQ.val(17)
            }), params, IGNORE_TRUE);
            expect(result).toBe('CASE WHEN $1 = $2 THEN $3 WHEN $4 = $5 THEN $6 ELSE $7 END');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(7);
            expect(params[0]).toBe(10);
            expect(params[1]).toBe(10);
            expect(params[2]).toBe(12);
            expect(params[3]).toBe('a');
            expect(params[4]).toBe('a');
            expect(params[5]).toBe(15);
            expect(params[6]).toBe(17);
        });
        test('otherwise', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.swt({otherwise: TQ.val(17)}), params, IGNORE_TRUE);
            expect(result).toBe('$1');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(1);
            expect(params[0]).toBe(17);
        });
    });
    test('column', () => {
        const params: any[] = [];
        const result = resolveExpression(TQ.col('title', User), params, IGNORE_TRUE);
        expect(result).toBe('"public"."user"."title"');
        expect(Array.isArray(params)).toBe(true);
        expect(params).toHaveLength(0);
    });
    test('raw', () => {
        const params: any[] = [];
        const result = resolveExpression(TQ.raw('blah blah!'), params, IGNORE_TRUE);
        expect(result).toBe('blah blah!');
        expect(Array.isArray(params)).toBe(true);
        expect(params).toHaveLength(0);
    });

    // scope
    describe('not', () => {
        test('undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.notScope(undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('simple', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.notScope(TQ.eqOp(TQ.val(12), TQ.val(13))), params, IGNORE_TRUE);
            expect(result).toBe('NOT ($1 = $2)');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe(12);
            expect(params[1]).toBe(13);
        });
    });
    describe('and', () => {
        andOrTest('AND');
    });
    describe('or', () => {
        andOrTest('OR');
    });

    // operator
    describe('is-null', () => {
        test('undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.isNullOp(undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        })
        test('simple', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.isNullOp(TQ.val(null)), params, IGNORE_TRUE);
            expect(result).toBe('$1 IS NULL');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(1);
            expect(params[0]).toBe('NULL');
        });
    });
    describe('is-not-null', () => {
        test('undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.isNotNullOp(undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        })
        test('simple', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.isNotNullOp(TQ.val(null)), params, IGNORE_TRUE);
            expect(result).toBe('$1 IS NOT NULL');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(1);
            expect(params[0]).toBe('NULL');
        });
    });
    describe('equal', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.eqOp(undefined, undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.eqOp(undefined, TQ.val('a')), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.eqOp(TQ.val('a'), undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('string', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.eqOp(TQ.val('a'), TQ.val('b')), params, IGNORE_TRUE);
            expect(result).toBe('$1 = $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
    });
    describe('not-equal', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.notEqOp(undefined, undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.notEqOp(undefined, TQ.val('a')), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.notEqOp(TQ.val('a'), undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('string', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.notEqOp(TQ.val('a'), TQ.val('b')), params, IGNORE_TRUE);
            expect(result).toBe('$1 <> $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
    });
    describe('greater', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.gOp(undefined, undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.gOp(undefined, TQ.val('a')), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.gOp(TQ.val('a'), undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('string', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.gOp(TQ.val('a'), TQ.val('b')), params, IGNORE_TRUE);
            expect(result).toBe('$1 > $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
    });
    describe('greater-or-equal', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.gEqOp(undefined, undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.gEqOp(undefined, TQ.val('a')), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.gEqOp(TQ.val('a'), undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('string', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.gEqOp(TQ.val('a'), TQ.val('b')), params, IGNORE_TRUE);
            expect(result).toBe('$1 >= $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
    });
    describe('less-than', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lOp(undefined, undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lOp(undefined, TQ.val('a')), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lOp(TQ.val('a'), undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('string', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lOp(TQ.val('a'), TQ.val('b')), params, IGNORE_TRUE);
            expect(result).toBe('$1 < $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
    });
    describe('less-than-or-equal', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lEqOp(undefined, undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lEqOp(undefined, TQ.val('a')), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lEqOp(TQ.val('a'), undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('string', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lEqOp(TQ.val('a'), TQ.val('b')), params, IGNORE_TRUE);
            expect(result).toBe('$1 <= $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
    });
    describe('like', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lkOp(undefined, undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lkOp(undefined, TQ.val('a')), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lkOp(TQ.val('a'), undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('string', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lkOp(TQ.val('a'), TQ.val('b')), params, IGNORE_TRUE);
            expect(result).toBe('$1 LIKE $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
    });
    describe('in', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.inOp(undefined, undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.inOp(undefined, []), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.inOp(TQ.val('a'), undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('single-item-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.inOp(TQ.val('a'), [TQ.val('b')]), params, IGNORE_TRUE);
            expect(result).toBe('$1 = $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
        test('array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.inOp(TQ.val('a'), [TQ.val('b'), undefined]), params, IGNORE_TRUE);
            expect(result).toBe('$1 = $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
        test('multi-items-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.inOp(TQ.val('a'), [TQ.val('b'), TQ.val('c')]), params, IGNORE_TRUE);
            expect(result).toBe('$1 IN ($2, $3)');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(3);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
            expect(params[2]).toBe('c');
        });
    });
    describe('not-in', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.notInOp(undefined, undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.notInOp(undefined, []), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.notInOp(TQ.val('a'), undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('single-item-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.notInOp(TQ.val('a'), [TQ.val('b')]), params, IGNORE_TRUE);
            expect(result).toBe('$1 <> $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
        test('array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.notInOp(TQ.val('a'), [TQ.val('b'), undefined]), params, IGNORE_TRUE);
            expect(result).toBe('$1 <> $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
        test('multi-items-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.notInOp(TQ.val('a'), [TQ.val('b'), TQ.val('c')]), params, IGNORE_TRUE);
            expect(result).toBe('$1 NOT IN ($2, $3)');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(3);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
            expect(params[2]).toBe('c');
        });
    });
    describe('like-all', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lkaOp(undefined, undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lkaOp(undefined, []), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lkaOp(TQ.val('a'), undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('single-item-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lkaOp(TQ.val('a'), [TQ.val('b')]), params, IGNORE_TRUE);
            expect(result).toBe('$1 LIKE $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
        test('array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lkaOp(TQ.val('a'), [TQ.val('b'), undefined]), params, IGNORE_TRUE);
            expect(result).toBe('$1 LIKE $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
        test('multi-items-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lkaOp(TQ.val('a'), [TQ.val('b'), TQ.val('c')]), params, IGNORE_TRUE);
            expect(result).toBe('$1 LIKE ALL(ARRAY[$2, $3])');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(3);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
            expect(params[2]).toBe('c');
        });
    });
    describe('like-some', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lksOp(undefined, undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lksOp(undefined, []), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lksOp(TQ.val('a'), undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('single-item-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lksOp(TQ.val('a'), [TQ.val('b')]), params, IGNORE_TRUE);
            expect(result).toBe('$1 LIKE $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
        test('array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lksOp(TQ.val('a'), [TQ.val('b'), undefined]), params, IGNORE_TRUE);
            expect(result).toBe('$1 LIKE $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
        });
        test('multi-items-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.lksOp(TQ.val('a'), [TQ.val('b'), TQ.val('c')]), params, IGNORE_TRUE);
            expect(result).toBe('$1 LIKE SOME(ARRAY[$2, $3])');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(3);
            expect(params[0]).toBe('a');
            expect(params[1]).toBe('b');
            expect(params[2]).toBe('c');
        });
    });
    describe('between', () => {
        test('undefined-1-2-3', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.btOp(undefined, undefined, undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1-3', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.btOp(undefined, TQ.val(12), undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.btOp(undefined, undefined, TQ.val(12)), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-3', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.btOp(TQ.val(12), TQ.val(12), undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.btOp(TQ.val(12), undefined, TQ.val(12)), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.btOp(undefined, TQ.val(12), TQ.val(12)), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('number', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.btOp(TQ.val(1), TQ.val(2), TQ.val(3)), params, IGNORE_TRUE);
            expect(result).toBe('$1 BETWEEN $2 AND $3');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(3);
            expect(params[0]).toBe(1);
            expect(params[1]).toBe(2);
            expect(params[2]).toBe(3);
        });
    });
    describe('json-@>', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jAtROp(undefined, undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jAtROp(undefined, TQ.val(['a'])), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jAtROp(TQ.val(['a']), undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('string', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jAtROp(TQ.val(['a']), TQ.val(['b'])), params, IGNORE_TRUE);
            expect(result).toBe('$1 @> $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('["a"]');
            expect(params[1]).toBe('["b"]');
        });
    });
    describe('json-<@', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jAtLOp(undefined, undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jAtLOp(undefined, TQ.val(['a'])), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jAtLOp(TQ.val(['a']), undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('string', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jAtLOp(TQ.val(['a']), TQ.val(['b'])), params, IGNORE_TRUE);
            expect(result).toBe('$1 <@ $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('["a"]');
            expect(params[1]).toBe('["b"]');
        });
    });
    describe('json-?', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jIsOp(undefined, undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jIsOp(undefined, TQ.val('a')), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jIsOp(TQ.val(['a']), undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('string', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jIsOp(TQ.val(['a']), TQ.val('b')), params, IGNORE_TRUE);
            expect(result).toBe('$1 ? $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('["a"]');
            expect(params[1]).toBe('b');
        });
    });
    describe('json-?|', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jOrOp(undefined, undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jOrOp(undefined, [TQ.val('a')]), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jOrOp(TQ.val(['a']), undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('single-item-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jOrOp(TQ.val(['a']), [TQ.val('b')]), params, IGNORE_TRUE);
            expect(result).toBe('$1 ? $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('["a"]');
            expect(params[1]).toBe('b');
        });
        test('array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jOrOp(TQ.val(['a']), [TQ.val('b'), undefined]), params, IGNORE_TRUE);
            expect(result).toBe('$1 ? $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('["a"]');
            expect(params[1]).toBe('b');
        });
        test('multi-items-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jOrOp(TQ.val(['a']), [TQ.val('b'), TQ.val('c')]), params, IGNORE_TRUE);
            expect(result).toBe('$1 ?| ARRAY[$2, $3]');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(3);
            expect(params[0]).toBe('["a"]');
            expect(params[1]).toBe('b');
            expect(params[2]).toBe('c');
        });
    });
    describe('json-?&', () => {
        test('undefined-1-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jAndOp(undefined, undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-1', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jAndOp(undefined, [TQ.val('a')]), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('undefined-2', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jAndOp(TQ.val(['a']), undefined), params, IGNORE_TRUE);
            expect(result).toBe(true);
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(0);
        });
        test('single-item-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jAndOp(TQ.val(['a']), [TQ.val('b')]), params, IGNORE_TRUE);
            expect(result).toBe('$1 ? $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('["a"]');
            expect(params[1]).toBe('b');
        });
        test('array-with-undefined', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jAndOp(TQ.val(['a']), [TQ.val('b'), undefined]), params, IGNORE_TRUE);
            expect(result).toBe('$1 ? $2');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(2);
            expect(params[0]).toBe('["a"]');
            expect(params[1]).toBe('b');
        });
        test('multi-items-array', () => {
            const params: any[] = [];
            const result = resolveExpression(TQ.jAndOp(TQ.val(['a']), [TQ.val('b'), TQ.val('c')]), params, IGNORE_TRUE);
            expect(result).toBe('$1 ?& ARRAY[$2, $3]');
            expect(Array.isArray(params)).toBe(true);
            expect(params).toHaveLength(3);
            expect(params[0]).toBe('["a"]');
            expect(params[1]).toBe('b');
            expect(params[2]).toBe('c');
        });
    });
});