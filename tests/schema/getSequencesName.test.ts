import {getSequenceName} from '../../src/schema';

test('seqTitle', () => {
    expect(getSequenceName('test_table', 'id', {seqTitle: 'my_custom_title'}))
        .toBe('my_custom_title');
});

test('column title', () => {
    expect(getSequenceName('test_table', 'id', {title: 'ID'}))
        .toBe('test_table_ID_seq');
});

test('key', () => {
    expect(getSequenceName('test_table', 'id', {}))
        .toBe('test_table_id_seq');
});