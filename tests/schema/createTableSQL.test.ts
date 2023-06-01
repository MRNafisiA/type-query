import { createTableSQL } from '../../src/schema';

test('no-column and no-primary', () => {
    expect(
        createTableSQL({
            schema: 'public',
            title: 'test_table',
            columns: {}
        })
    ).toBe(`CREATE TABLE "public"."test_table"( ) ;`);
});

test('key and not-null', () => {
    expect(
        createTableSQL({
            schema: 'public',
            title: 'test_table',
            columns: {
                id: {
                    type: 'smallint',
                    nullable: false,
                    default: false
                }
            }
        })
    ).toBe(`CREATE TABLE "public"."test_table"( "id" smallint NOT NULL ) ;`);
});

test('title and null', () => {
    expect(
        createTableSQL({
            schema: 'public',
            title: 'test_table',
            columns: {
                id: {
                    type: 'smallint',
                    nullable: true,
                    default: false,
                    title: 'custom_title'
                }
            }
        })
    ).toBe(`CREATE TABLE "public"."test_table"( "custom_title" smallint NULL ) ;`);
});

test('auto-increment', () => {
    expect(
        createTableSQL({
            schema: 'public',
            title: 'test_table',
            columns: {
                id: {
                    type: 'smallint',
                    nullable: true,
                    default: 'auto-increment'
                }
            }
        })
    ).toBe(
        `CREATE TABLE "public"."test_table"( "id" smallint DEFAULT nextVal( '"public"."test_table_id_seq"'::regClass ) NULL ) ;`
    );
});

test('default-true', () => {
    expect(
        createTableSQL({
            schema: 'public',
            title: 'test_table',
            columns: {
                id: {
                    type: 'smallint',
                    nullable: true,
                    default: true,
                    value: '100 + 50'
                }
            }
        })
    ).toBe(`CREATE TABLE "public"."test_table"( "id" smallint DEFAULT 100 + 50 NULL ) ;`);
});

test('reference-key and no-on-update and no-on-delete', () => {
    const ref = {
        schema: 'public',
        title: 'ref_table',
        columns: {
            pid: {
                type: 'smallint',
                nullable: false,
                default: false
            }
        }
    } as const;
    expect(
        createTableSQL({
            schema: 'public',
            title: 'test_table',
            columns: {
                id: {
                    type: 'smallint',
                    nullable: true,
                    default: false,
                    reference: { table: ref, column: 'pid' }
                }
            }
        })
    ).toBe(
        `CREATE TABLE "public"."test_table"( "id" smallint NULL REFERENCES "public"."ref_table"( "pid" ) ON UPDATE NO ACTION ON DELETE NO ACTION ) ;`
    );
});

test('reference-title and on-update and on-delete', () => {
    const ref = {
        schema: 'public',
        title: 'ref_table',
        columns: {
            pid: {
                type: 'smallint',
                nullable: false,
                default: false,
                title: 'custom_title'
            }
        }
    } as const;
    expect(
        createTableSQL({
            schema: 'public',
            title: 'test_table',
            columns: {
                id: {
                    type: 'smallint',
                    nullable: true,
                    default: false,
                    reference: { table: ref, column: 'pid', onDelete: 'cascade', onUpdate: 'set-Default' }
                }
            }
        })
    ).toBe(
        `CREATE TABLE "public"."test_table"( "id" smallint NULL REFERENCES "public"."ref_table"( "custom_title" ) ON UPDATE SET DEFAULT ON DELETE CASCADE ) ;`
    );
});

test('primary', () => {
    expect(
        createTableSQL({
            schema: 'public',
            title: 'test_table',
            columns: {
                id: {
                    type: 'smallint',
                    nullable: false,
                    default: false,
                    primary: true
                }
            }
        })
    ).toBe(
        `CREATE TABLE "public"."test_table"( "id" smallint NOT NULL, CONSTRAINT "test_table_pk" PRIMARY KEY( "id" ) ) ;`
    );
});
