import {dropSequencesSQL} from '../../src/schema';

test('no sequence', () => {
    expect(dropSequencesSQL({
        schema: 'public',
        title: 'test_table',
        columns: {}
    })).toStrictEqual([]);
});

test('sequence', () => {
    expect(dropSequencesSQL({
        schema: 'public',
        title: 'test_table',
        columns: {
            id: {
                type: 'smallint',
                nullable: false,
                primary: true,
                default: 'auto-increment'
            }
        }
    })).toStrictEqual([`DROP SEQUENCE test_table_id_seq ;`]);
});