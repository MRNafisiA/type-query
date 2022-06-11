import {dropTableSQL} from '../../src/schema';

test('table', () => {
    expect(dropTableSQL({
        schema: 'public',
        title: 'test_table',
        columns: {}
    })).toBe('DROP TABLE "public"."test_table" ;');
});