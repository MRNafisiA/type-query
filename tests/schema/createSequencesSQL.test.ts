import {createSequencesSQL} from '../../src/schema';

test('no sequence', () => {
    expect(createSequencesSQL({
        schema: 'public',
        title: 'test_table',
        columns: {}
    })).toStrictEqual([]);
});

test('smallint sequence', () => {
    expect(createSequencesSQL({
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
    })).toStrictEqual([`CREATE SEQUENCE "public"."test_table_id_seq" as smallint ;`]);
});

test('integer sequence', () => {
    expect(createSequencesSQL({
        schema: 'public',
        title: 'test_table',
        columns: {
            id: {
                type: 'integer',
                nullable: false,
                primary: true,
                default: 'auto-increment'
            }
        }
    })).toStrictEqual([`CREATE SEQUENCE "public"."test_table_id_seq" as integer ;`]);
});

test('bigint sequence', () => {
    expect(createSequencesSQL({
        schema: 'public',
        title: 'test_table',
        columns: {
            id: {
                type: 'bigint',
                nullable: false,
                primary: true,
                default: 'auto-increment'
            }
        }
    })).toStrictEqual([`CREATE SEQUENCE "public"."test_table_id_seq" ;`]);
});