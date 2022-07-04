import {getSequenceName} from '../../src/schema';

test('seqTitle', () => {
    expect(getSequenceName('public', 'test_table', 'id', {seqTitle: 'my_custom_title'}))
        .toBe('"public"."my_custom_title"');
});

test('column title', () => {
    expect(getSequenceName('public', 'test_table', 'id', {title: 'ID'}))
        .toBe('"public"."test_table_ID_seq"');
});

test('key', () => {
    expect(getSequenceName('public', 'test_table', 'id', {}))
        .toBe('"public"."test_table_id_seq"');
});