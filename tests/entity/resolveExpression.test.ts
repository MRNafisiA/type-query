import U from '../../src/U';
import Decimal from 'decimal.js';
import {err, ok} from 'never-catch';
import {Param} from '../../src/types/entity';
import {resolveColumn, resolveExpression} from '../../src/entity';
import {toReservedExpressionKeyDescription as toDescription} from '../../src/dictionary';

describe('ignore-independent', () => {
    test('null', () => {
        const v = null;
        const result = resolveExpression(v, 2);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe(U.stringify(v, true));
        expect(params).toStrictEqual([]);
    });
    test('boolean', () => {
        const v = true;
        const result = resolveExpression(v, 2);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe(U.stringify(v, true));
        expect(params).toStrictEqual([]);
    });
    test('Decimal', () => {
        const v = new Decimal('1.1');
        const result = resolveExpression(v, 2);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe(`${U.stringify(v, true)}`);
        expect(params).toStrictEqual([]);
    });
    test('Date', () => {
        const v = new Date();
        const result = resolveExpression(v, 2);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe(`${U.stringify(v, true)}`);
        expect(params).toStrictEqual([]);
    });
    test('number', () => {
        const v = 1;
        const result = resolveExpression(v, 2);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe(`${U.stringify(v, true)}`);
        expect(params).toStrictEqual([]);
    });
    test('bigint', () => {
        const v = BigInt('12');
        const result = resolveExpression(v, 2);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe(`${U.stringify(v, true)}`);
        expect(params).toStrictEqual([]);
    });
    test('string', () => {
        const v = 'hello';
        const result = resolveExpression(v, 2);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('$2');
        expect(params).toStrictEqual([U.stringify(v, false)]);
    });
    test('json-object', () => {
        const v = {value: 'test'};
        const result = resolveExpression(v, 2);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('$2::jsonb');
        expect(params).toStrictEqual([U.stringify(v, false)]);
    });
    test('json-array-no-reserved-key', () => {
        const v = ['test1', {id: 12}];
        const result = resolveExpression(v, 2);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('$2::jsonb');
        expect(params).toStrictEqual([U.stringify(v, false)]);
    });
    test('val-not-undefined', () => {
        const v = 12;
        const result = resolveExpression(U.val(v), 2);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('$2');
        expect(params).toStrictEqual([U.stringify(v)]);
    });
    test('=n !=n not =t =f ok', () => {
        const v = null;
        const result = resolveExpression(U.nullOp(v, '= null'), 2);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe(`NULL IS NULL`);
        expect(params).toStrictEqual([]);
    });
    test('+ - * / || and or ** one-element-array', () => {
        const v = 12;
        const result = resolveExpression(U.artAllOp('+', [v]), 2);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe(`${U.stringify(v)}`);
        expect(params).toStrictEqual([]);
    });
    test('+ - * / || and or array', () => {
        const v = [12, 24];
        const result = resolveExpression(U.artAllOp('+', v), 2);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe(`( ${U.stringify(v[0])} + ${U.stringify(v[1])} )`);
        expect(params).toStrictEqual([]);
    });
    test('** two-elements-array', () => {
        const v = [12, 24];
        const result = resolveExpression(U.artAllOp('**', v), 2);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe(`power( ${U.stringify(v[0])}, ${U.stringify(v[1])} )`);
        expect(params).toStrictEqual([]);
    });
    test('** three-elements-array', () => {
        const v = [12, 24, 43];
        const result = resolveExpression(U.artAllOp('**', v), 2);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe(`power( ${U.stringify(v[0])}, power( ${U.stringify(v[1])}, ${U.stringify(v[2])} ) )`);
        expect(params).toStrictEqual([]);
    });
    test('fun ok', () => {
        const v = [12, 43];
        const result = resolveExpression(U.fun('qq', v), 2);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe(`qq( ${U.stringify(v[0])}, ${U.stringify(v[1])} )`);
        expect(params).toStrictEqual([]);
    });
    test('fun ok cast', () => {
        const v = [12, 43];
        const result = resolveExpression(U.fun('qq', v, '::TEXT'), 2);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe(`qq( ${U.stringify(v[0])}, ${U.stringify(v[1])} )::TEXT`);
        expect(params).toStrictEqual([]);
    });
    test('swt cases-when-fail', () => {
        const result = resolveExpression(U.swt([{when: undefined, then: 4}], 12), 2);
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<${toDescription('swt')}>[cases][0][when] -> undefined`);
    });
    test('swt cases-then-fail', () => {
        const result = resolveExpression(U.swt([{when: true, then: undefined}], 12), 2);
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<${toDescription('swt')}>[cases][0][then] -> undefined`);
    });
    test('swt', () => {
        const result = resolveExpression(U.swt([{when: true, then: 12}], 30), 2);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe(`CASE WHEN TRUE THEN ${U.stringify(12)} ELSE ${U.stringify(30)} END`);
        expect(params).toStrictEqual([]);
    });
    test('col', () => {
        const User = {
            schema: 'public',
            title: 'user',
            columns: {id: {type: 'smallint', nullable: false, default: false}}
        } as const;
        const result = resolveExpression(U.col(User, 'id'), 2);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe(resolveColumn(User, 'id', false));
        expect(params).toStrictEqual([]);
    });
    test('raw', () => {
        const result = resolveExpression(U.raw('now()'), 2);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('now()');
        expect(params).toStrictEqual([]);
    });
    test('qry exists ok', () => {
        const sql = 'SELECT now() as "t" ;';
        const result = resolveExpression(U.subQry({
            getData: (params: Param[]) => ok({
                sql,
                params
            })
        } as any), 2);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe(`( ${sql} )`);
        expect(params).toStrictEqual([]);
    });
    test('qry exists fail', () => {
        const result = resolveExpression(U.existsOp({
            getData: (_: Param[]) => err(`just error!`)
        } as any), 2);
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<${toDescription('exists')}> -> just error!`);
    });
    test('= != > >= < <= lk ? j- @> <@ ok', () => {
        const result = resolveExpression(U.cmpOp(12, '=', U.val(13)), 2);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('12 = $2');
        expect(params).toStrictEqual([U.stringify(13)]);
    });
    test('in nin ?| ?& j-a lka lks second-operand-empty', () => {
        const result = resolveExpression(U.listOp(12, 'in', []), 2);
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<${toDescription('in')}>[second operand] -> empty`);
    });
    test('in nin ?| ?& j-a lka lks second-operand-one-element', () => {
        const result = resolveExpression(U.listOp(12, 'in', [U.val(42)]), 2);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('12 = $2');
        expect(params).toStrictEqual([U.stringify(42)]);
    });
    test('in nin ?| ?& j-a lka lks ok', () => {
        const result = resolveExpression(U.listOp(12, 'in', [U.val(42), 32]), 2);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('12 IN ( $2, 32 )');
        expect(params).toStrictEqual([U.stringify(42)]);
    });
    test('bt ok', () => {
        const result = resolveExpression(U.btOp(14, 13, U.val(15)), 2);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('14 BETWEEN 13 AND $2');
        expect(params).toStrictEqual([U.stringify(15)]);
    });
});

describe('ignore-false', () => {
    test('undefined', () => {
        const result = resolveExpression(undefined, 2, false);
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe('undefined');
    });
    test('val-undefined', () => {
        const v = undefined;
        const result = resolveExpression(U.val(v), 2, false);
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<${toDescription('val')}> -> undefined`);
    });
    test('=n !=n not =t =f fail', () => {
        const v = undefined;
        const result = resolveExpression(U.nullOp(v, '= null'), 2, false);
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<${toDescription('=n')}> -> undefined`);
    });
    test('+ - * / || and or ** undefined operand', () => {
        const v = undefined;
        const result = resolveExpression(U.artAllOp('+', v), 2, false);
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<${toDescription('+')}> -> undefined`);
    });
    test('+ - * / || and or ** array-fail', () => {
        const v = [12, undefined];
        const result = resolveExpression(U.artAllOp('+', v), 2, false);
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<${toDescription('+')}>[1] -> undefined`);
    });
    test('+ - * / || and or ** empty-array', () => {
        const v: number[] = [];
        const result = resolveExpression(U.artAllOp('+', v), 2, false);
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<${toDescription('+')}> -> no operands given`);
    });
    test('fun name-undefined', () => {
        const result = resolveExpression(U.fun(undefined, undefined), 2, false);
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<${toDescription('fun')}>[name] -> undefined`);
    });
    test('fun parameters-undefined', () => {
        const result = resolveExpression(U.fun('qq', undefined), 2, false);
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<${toDescription('fun')}>[parameters] -> undefined`);
    });
    test('fun parameters-fail', () => {
        const v = [12, undefined];
        const result = resolveExpression(U.fun('qq', v), 2, false);
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<${toDescription('fun')}>[parameters][1] -> undefined`);
    });
    test('swt cases-undefined', () => {
        const result = resolveExpression(U.swt(undefined, 2), 2, false);
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<${toDescription('swt')}>[cases] -> undefined`);
    });
    test('swt cases-fail', () => {
        const result = resolveExpression(U.swt([{when: true, then: 4}, undefined], 12), 2, false);
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<${toDescription('swt')}>[cases][1] -> undefined`);
    });
    test('swt otherwise-only', () => {
        const v = 2;
        const result = resolveExpression(U.swt([], v), 2, false);
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<${toDescription('swt')}>[cases] -> empty`);
    });
    test('swt otherwise-undefined', () => {
        const result = resolveExpression(U.swt([{when: true, then: U.val(12)}], undefined), 2, false);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe(`CASE WHEN TRUE THEN $2 END`);
        expect(params).toStrictEqual([U.stringify(12)]);
    });
    test('swt otherwise-fail', () => {
        const result = resolveExpression(U.swt([{when: true, then: 12}], U.artOp(2, '+', undefined)), 2, false);
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<${toDescription('swt')}>[otherwise] -> <sum>[1] -> undefined`);
    });
    test('= != > >= < <= lk ? j- @> <@ first-operand-fail', () => {
        const result = resolveExpression(U.cmpOp(undefined, '=', 12), 2, false);
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<${toDescription('=')}>[first operand] -> undefined`);
    });
    test('= != > >= < <= lk ? j- @> <@ second-operand-fail', () => {
        const result = resolveExpression(U.cmpOp(12, '=', undefined), 2, false);
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<${toDescription('=')}>[second operand] -> undefined`);
    });
    test('in nin ?| ?& j-a lka lks first-operand-fail', () => {
        const result = resolveExpression(U.listOp(undefined, 'in', [U.val(13)]), 2, false);
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<${toDescription('in')}>[first operand] -> undefined`);
    });
    test('in nin ?| ?& j-a lka lks second-operand-undefined', () => {
        const result = resolveExpression(U.listOp(12, 'in', undefined), 2, false);
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<${toDescription('in')}>[second operand] -> undefined`);
    });
    test('in nin ?| ?& j-a lka lks second-operand-fail', () => {
        const result = resolveExpression(U.listOp(12, 'in', [U.val(12), undefined]), 2, false);
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<${toDescription('in')}>[second operand][1] -> undefined`);
    });
    test('bt first-operand-fail', () => {
        const result = resolveExpression(U.btOp(undefined, 13, 15), 2, false);
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<${toDescription('bt')}>[first operand] -> undefined`);
    });
    test('bt second-operand-fail', () => {
        const result = resolveExpression(U.btOp(14, undefined, 13), 2, false);
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<${toDescription('bt')}>[second operand] -> undefined`);
    });
    test('bt third-operand-fail', () => {
        const result = resolveExpression(U.btOp(14, 13, undefined), 2, false);
        if (result.ok) {
            throw 'it should not reach here';
        }
        expect(result.error).toBe(`<${toDescription('bt')}>[third operand] -> undefined`);
    });
});

describe('ignore-true', () => {
    test('undefined', () => {
        const result = resolveExpression(undefined, 2, true);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('');
        expect(params).toStrictEqual([]);
    });
    test('val-undefined', () => {
        const v = undefined;
        const result = resolveExpression(U.val(v), 2, true);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('');
        expect(params).toStrictEqual([]);
    });
    test('=n !=n not =t =f neutral', () => {
        const v = undefined;
        const result = resolveExpression(U.nullOp(v, '= null'), 2, true);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('');
        expect(params).toStrictEqual([]);
    });
    test('+ - * / || and or ** undefined operand', () => {
        const v = undefined;
        const result = resolveExpression(U.artAllOp('+', v), 2, true);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('');
        expect(params).toStrictEqual([]);
    });
    test('+ - * / || and or ** array-neutral', () => {
        const v = [12, undefined, U.val(13)];
        const result = resolveExpression(U.artAllOp('+', v), 2, true);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('( 12 + $2 )');
        expect(params).toStrictEqual([U.stringify(13)]);
    });
    test('+ - * / || and or ** empty-array', () => {
        const v: number[] = [];
        const result = resolveExpression(U.artAllOp('+', v), 2, true);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('');
        expect(params).toStrictEqual([]);
    });
    test('fun name-undefined', () => {
        const result = resolveExpression(U.fun(undefined, undefined), 2, true);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('');
        expect(params).toStrictEqual([]);
    });
    test('fun parameters-undefined', () => {
        const result = resolveExpression(U.fun('qq', undefined), 2, true);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('');
        expect(params).toStrictEqual([]);
    });
    test('fun parameters-neutral', () => {
        const v = [12, undefined];
        const result = resolveExpression(U.fun('qq', v), 2, true);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('');
        expect(params).toStrictEqual([]);
    });
    test('swt cases-undefined otherwise-undefined', () => {
        const result = resolveExpression(U.swt(undefined, undefined), 2, true);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('');
        expect(params).toStrictEqual([]);
    });
    test('swt cases-neutral otherwise-undefined', () => {
        const result = resolveExpression(U.swt([
            undefined,
            {when: true, then: U.val(4)},
            undefined
        ]), 2, true);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('CASE WHEN TRUE THEN $2 END');
        expect(params).toStrictEqual([U.stringify(4)]);
    });
    test('swt cases-neutral-empty otherwise-undefined', () => {
        const result = resolveExpression(U.swt([
            undefined,
            undefined
        ]), 2, true);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('');
        expect(params).toStrictEqual([]);
    });
    test('swt cases-when-neutral otherwise-undefined', () => {
        const result = resolveExpression(U.swt([
            {when: true, then: U.val(4)},
            {when: undefined, then: 5}
        ], undefined), 2, true);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('CASE WHEN TRUE THEN $2 END');
        expect(params).toStrictEqual([U.stringify(4)]);
    });
    test('swt cases-when-neutral-empty otherwise-undefined', () => {
        const result = resolveExpression(U.swt([{when: undefined, then: 4}], undefined), 2, true);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('');
        expect(params).toStrictEqual([]);
    });
    test('swt cases-then-neutral otherwise-undefined', () => {
        const result = resolveExpression(U.swt([
            {when: false, then: undefined},
            {when: true, then: U.val(2)}
        ], undefined), 2, true);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('CASE WHEN TRUE THEN $2 END');
        expect(params).toStrictEqual([U.stringify(2)]);
    });
    test('swt cases-then-neutral-empty otherwise-undefined', () => {
        const result = resolveExpression(U.swt([{when: true, then: undefined}], undefined), 2, true);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('');
        expect(params).toStrictEqual([]);
    });
    test('swt cases-undefined otherwise-neutral', () => {
        const result = resolveExpression(U.swt(undefined, U.artOp(undefined, '+', undefined)), 2, true);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('');
        expect(params).toStrictEqual([]);
    });
    test('swt cases-undefined otherwise-ok', () => {
        const result = resolveExpression(U.swt(undefined, U.val(12)), 2, true);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('$2');
        expect(params).toStrictEqual([U.stringify(12)]);
    });
    test('swt cases-undefined otherwise-neutral', () => {
        const result = resolveExpression(U.swt([{when: true, then: 4}], U.artOp(undefined, '+', undefined)), 2, true);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('CASE WHEN TRUE THEN 4 END');
        expect(params).toStrictEqual([]);
    });
    test('= != > >= < <= lk ? j- @> <@ first-operand-neutral', () => {
        const result = resolveExpression(U.cmpOp(undefined, '=', 12), 2, true);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('');
        expect(params).toStrictEqual([]);
    });
    test('= != > >= < <= lk ? j- @> <@ second-operand-neutral', () => {
        const result = resolveExpression(U.cmpOp(12, '=', undefined), 2, true);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('');
        expect(params).toStrictEqual([]);
    });
    test('in nin ?| ?& j-a lka lks first-operand-neutral', () => {
        const result = resolveExpression(U.listOp(undefined, 'in', [U.val(13)]), 2, true);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('');
        expect(params).toStrictEqual([]);
    });
    test('in nin ?| ?& j-a lka lks second-operand-undefined', () => {
        const result = resolveExpression(U.listOp(12, 'in', undefined), 2, true);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('');
        expect(params).toStrictEqual([]);
    });
    test('in nin ?| ?& j-a lka lks second-operand-neutral', () => {
        const result = resolveExpression(U.listOp(12, 'in', [U.val(12), undefined, 14]), 2, true);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('12 IN ( $2, 14 )');
        expect(params).toStrictEqual([U.stringify(12)]);
    });
    test('bt first-operand-neutral', () => {
        const result = resolveExpression(U.btOp(undefined, 13, 15), 2, true);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('');
        expect(params).toStrictEqual([]);
    });
    test('bt second-operand-neutral', () => {
        const result = resolveExpression(U.btOp(14, undefined, 13), 2, true);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('');
        expect(params).toStrictEqual([]);
    });
    test('bt third-operand-neutral', () => {
        const result = resolveExpression(U.btOp(14, 13, undefined), 2, true);
        if (!result.ok) {
            throw 'it should not reach here';
        }
        const {text, params} = result.value;
        expect(text).toBe('');
        expect(params).toStrictEqual([]);
    });
});