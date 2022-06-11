import U from '../src/U';
import Decimal from 'decimal.js';

describe('stringify', () => {
    test('null', () => {
        const result = U.stringify(null);
        expect(result).toBe('NULL');
    });
    test('boolean', () => {
        const result = U.stringify(true);
        expect(result).toBe('TRUE');
    });
    test('number', () => {
        const result = U.stringify(12);
        expect(result).toBe(12);
    });
    test('bigint', () => {
        const result = U.stringify(BigInt('12'));
        expect(result).toBe(BigInt('12'));
    });
    test('decimal', () => {
        const result = U.stringify(new Decimal('12.2'));
        expect(result.toString()).toBe(new Decimal('12.2').toString());
    });
    test('Date', () => {
        const now = new Date();
        const result = U.stringify(now);
        expect(result).toBe(now.toISOString());
    });
    test('object', () => {
        const v = ['hello'];
        const result = U.stringify(v);
        expect(result).toBe(JSON.stringify(v));
    });
    test('other', () => {
        const v = 'hello';
        const result = U.stringify(v);
        expect(result).toBe(v);
    });
});