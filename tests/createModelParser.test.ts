import Decimal from 'decimal.js';
import { Json, Table } from '../src';
import { err, ok } from 'never-catch';
import { createModelParser } from '../src/createModelParser';

type TestSchema = {
    customParser: {
        type: 1 | 2;
        nullable: false;
        default: false;
    };
    boolean: {
        type: boolean;
        nullable: false;
        default: false;
    };
    int2_withMin: {
        type: number;
        nullable: false;
        default: false;
    };
    int2_withMax: {
        type: number;
        nullable: false;
        default: false;
    };
    int2_null: {
        type: number;
        nullable: true;
        default: false;
    };
    int4_withMin: {
        type: number;
        nullable: false;
        default: false;
    };
    int4_withMax: {
        type: number;
        nullable: false;
        default: false;
    };
    int4_null: {
        type: number;
        nullable: true;
        default: false;
    };
    int8_withMin: {
        type: bigint;
        nullable: false;
        default: false;
    };
    int8_withMax: {
        type: bigint;
        nullable: false;
        default: false;
    };
    int8_null: {
        type: bigint;
        nullable: true;
        default: false;
    };
    float4And8_withMin: {
        type: number;
        nullable: false;
        default: false;
    };
    float4And8_withMax: {
        type: number;
        nullable: false;
        default: false;
    };
    float4And8_null: {
        type: number;
        nullable: true;
        default: false;
    };
    decimal_precision: {
        type: Decimal;
        nullable: false;
        default: false;
    };
    decimal_scale: {
        type: Decimal;
        nullable: false;
        default: false;
    };
    decimal_withMin: {
        type: Decimal;
        nullable: false;
        default: false;
    };
    decimal_withMax: {
        type: Decimal;
        nullable: false;
        default: false;
    };
    decimal_null: {
        type: Decimal;
        nullable: true;
        default: false;
    };
    charAndVarcharAndTextAndUUID_withMinLength: {
        type: string;
        nullable: false;
        default: false;
    };
    charAndVarcharAndTextAndUUID_withMaxLengthAndRegex: {
        type: string;
        nullable: false;
        default: false;
    };
    charAndVarcharAndTextAndUUID_null: {
        type: string;
        nullable: true;
        default: false;
    };
    timestampAndTimestamptz: {
        type: Date;
        nullable: false;
        default: false;
    };
    jsonAndJsonb: {
        type: Json;
        nullable: false;
        default: false;
    };
};
const TestTable: Table<TestSchema> = {
    schemaName: 'public',
    tableName: 'test',
    columns: {
        customParser: {
            type: 'int2',
            nullable: false,
            default: false
        },
        boolean: {
            type: 'boolean',
            nullable: false,
            default: false
        },
        int2_withMin: {
            type: 'int2',
            nullable: false,
            default: false,
            min: -1
        },
        int2_withMax: {
            type: 'int2',
            nullable: false,
            default: false,
            max: 1
        },
        int2_null: {
            type: 'int2',
            nullable: true,
            default: false
        },
        int4_withMin: {
            type: 'int4',
            nullable: false,
            default: false,
            min: -1
        },
        int4_withMax: {
            type: 'int4',
            nullable: false,
            default: false,
            max: 1
        },
        int4_null: {
            type: 'int4',
            nullable: true,
            default: false
        },
        int8_withMin: {
            type: 'int8',
            nullable: false,
            default: false,
            min: BigInt(-1)
        },
        int8_withMax: {
            type: 'int8',
            nullable: false,
            default: false,
            max: BigInt(1)
        },
        int8_null: {
            type: 'int8',
            nullable: true,
            default: false
        },
        float4And8_withMin: {
            type: 'float4',
            nullable: false,
            default: false,
            min: -0.5
        },
        float4And8_withMax: {
            type: 'float4',
            nullable: false,
            default: false,
            max: 0.5
        },
        float4And8_null: {
            type: 'float4',
            nullable: true,
            default: false
        },
        decimal_precision: {
            type: 'decimal',
            nullable: false,
            default: false,
            precision: 3,
            scale: 3
        },
        decimal_scale: {
            type: 'decimal',
            nullable: false,
            default: false,
            precision: 3,
            scale: 3
        },
        decimal_withMin: {
            type: 'decimal',
            nullable: false,
            default: false,
            precision: 3,
            scale: 3,
            min: new Decimal('-0.9')
        },
        decimal_withMax: {
            type: 'decimal',
            nullable: false,
            default: false,
            precision: 3,
            scale: 3,
            max: new Decimal('0.9')
        },
        decimal_null: {
            type: 'decimal',
            nullable: true,
            default: false,
            precision: 3,
            scale: 3
        },
        charAndVarcharAndTextAndUUID_withMinLength: {
            type: 'varchar',
            nullable: false,
            default: false,
            minLength: 1
        },
        charAndVarcharAndTextAndUUID_withMaxLengthAndRegex: {
            type: 'varchar',
            nullable: false,
            default: false,
            maxLength: 2,
            regex: /1/
        },
        charAndVarcharAndTextAndUUID_null: {
            type: 'varchar',
            nullable: true,
            default: false
        },
        timestampAndTimestamptz: {
            type: 'timestamp',
            nullable: false,
            default: false
        },
        jsonAndJsonb: {
            type: 'json',
            nullable: false,
            default: false
        }
    }
};
const TestModelParser = createModelParser(TestTable, {
    parsers: {
        customParser: v => (v === 1 || v === 2 ? v : undefined)
    }
});

describe('createModelUtils', () => {
    describe('null', () => {
        test('int2_null', () => {
            const result = TestModelParser.int2_null(null);

            expect(result).toStrictEqual(null);
        });
        test('int4_null', () => {
            const result = TestModelParser.int4_null(null);

            expect(result).toStrictEqual(null);
        });
        test('int8_null', () => {
            const result = TestModelParser.int8_null(null);

            expect(result).toStrictEqual(null);
        });
        test('float4And8_null', () => {
            const result = TestModelParser.float4And8_null(null);

            expect(result).toStrictEqual(null);
        });
        test('decimal_null', () => {
            const result = TestModelParser.decimal_null(null);

            expect(result).toStrictEqual(null);
        });
        test('charAndVarcharAndTextAndUUID_null', () => {
            const result =
                TestModelParser.charAndVarcharAndTextAndUUID_null(null);

            expect(result).toStrictEqual(null);
        });
    });
    describe('undefined', () => {
        test('customParser', () => {
            const result = TestModelParser.customParser(32768);

            expect(result).toStrictEqual(undefined);
        });
        test('boolean', () => {
            const result = TestModelParser.boolean('a');

            expect(result).toStrictEqual(undefined);
        });
        test('int2_withMin', () => {
            const result = TestModelParser.int2_withMin('-2');

            expect(result).toStrictEqual(undefined);
        });
        test('int2_withMax', () => {
            const result = TestModelParser.int2_withMax('2');

            expect(result).toStrictEqual(undefined);
        });
        test('int4_withMin', () => {
            const result = TestModelParser.int4_withMin('-2');

            expect(result).toStrictEqual(undefined);
        });
        test('int4_withMax', () => {
            const result = TestModelParser.int4_withMax('2');

            expect(result).toStrictEqual(undefined);
        });
        test('int8_withMin', () => {
            const result = TestModelParser.int8_withMin('-2');

            expect(result).toStrictEqual(undefined);
        });
        test('int8_withMax', () => {
            const result = TestModelParser.int8_withMax('2');

            expect(result).toStrictEqual(undefined);
        });
        test('float4And8_withMin', () => {
            const result = TestModelParser.float4And8_withMin('-1');

            expect(result).toStrictEqual(undefined);
        });
        test('float4And8_withMax', () => {
            const result = TestModelParser.float4And8_withMax('1');

            expect(result).toStrictEqual(undefined);
        });
        test('decimal_precision', () => {
            const result = TestModelParser.decimal_precision('1234.12');

            expect(result).toStrictEqual(undefined);
        });
        test('decimal_scale', () => {
            const result = TestModelParser.decimal_scale('12.3456');

            expect(result).toStrictEqual(undefined);
        });
        test('decimal_withMin', () => {
            const result = TestModelParser.decimal_withMin('-1');

            expect(result).toStrictEqual(undefined);
        });
        test('decimal_withMax', () => {
            const result = TestModelParser.decimal_withMax('1');

            expect(result).toStrictEqual(undefined);
        });
        test('charAndVarcharAndTextAndUUID_withMinLength', () => {
            const result =
                TestModelParser.charAndVarcharAndTextAndUUID_withMinLength('');

            expect(result).toStrictEqual(undefined);
        });
        test('charAndVarcharAndTextAndUUID_withMaxLength', () => {
            const result =
                TestModelParser.charAndVarcharAndTextAndUUID_withMaxLengthAndRegex(
                    'aaa'
                );

            expect(result).toStrictEqual(undefined);
        });
        test('timestampAndTimestamptz', () => {
            const result = TestModelParser.timestampAndTimestamptz('a');

            expect(result).toStrictEqual(undefined);
        });
        test('jsonAndJsonb', () => {
            const result = TestModelParser.jsonAndJsonb('a');

            expect(result).toStrictEqual(undefined);
        });
    });
    describe('value', () => {
        test('customParser', () => {
            const result = TestModelParser.customParser('1');

            expect(result).toStrictEqual(1);
        });
        test('boolean', () => {
            const result = TestModelParser.boolean('t');

            expect(result).toStrictEqual(true);
        });
        test('int2_withMin', () => {
            const result = TestModelParser.int2_withMin('0');

            expect(result).toStrictEqual(0);
        });
        test('int2_withMax', () => {
            const result = TestModelParser.int2_withMax('0');

            expect(result).toStrictEqual(0);
        });
        test('int4_withMin', () => {
            const result = TestModelParser.int4_withMin('0');

            expect(result).toStrictEqual(0);
        });
        test('int4_withMax', () => {
            const result = TestModelParser.int4_withMax('0');

            expect(result).toStrictEqual(0);
        });
        test('int8_withMin', () => {
            const result = TestModelParser.int8_withMin('0');

            expect(result).toStrictEqual(BigInt(0));
        });
        test('int8_withMax', () => {
            const result = TestModelParser.int8_withMax('0');

            expect(result).toStrictEqual(BigInt(0));
        });
        test('float4And8_withMin', () => {
            const result = TestModelParser.float4And8_withMin('0');

            expect(result).toStrictEqual(0);
        });
        test('float4And8_withMax', () => {
            const result = TestModelParser.float4And8_withMax('0');

            expect(result).toStrictEqual(0);
        });
        test('decimal_withMin', () => {
            const result = TestModelParser.decimal_withMin('0');

            expect(result).toStrictEqual(new Decimal(0));
        });
        test('decimal_withMax', () => {
            const result = TestModelParser.decimal_withMax('0');

            expect(result).toStrictEqual(new Decimal(0));
        });
        test('charAndVarcharAndTextAndUUID_withMinLength', () => {
            const result =
                TestModelParser.charAndVarcharAndTextAndUUID_withMinLength(1);

            expect(result).toStrictEqual('1');
        });
        test('charAndVarcharAndTextAndUUID_withMaxLength', () => {
            const result =
                TestModelParser.charAndVarcharAndTextAndUUID_withMaxLengthAndRegex(
                    1
                );

            expect(result).toStrictEqual('1');
        });
        test('timestampAndTimestamptz', () => {
            const result = TestModelParser.timestampAndTimestamptz(
                '1970-01-01T00:00:00.001Z'
            );

            expect(result).toStrictEqual(new Date(1));
        });
        test('jsonAndJsonb', () => {
            const result = TestModelParser.jsonAndJsonb('{"a":1}');

            expect(result).toStrictEqual({ a: 1 });
        });
    });
    describe('Parse', () => {
        describe('default error', () => {
            test('require key', () => {
                const result = TestModelParser.Parse(
                    {},
                    ['customParser'] as const,
                    []
                );

                expect(result).toStrictEqual(err('customParser'));
            });
            test('require value', () => {
                const result = TestModelParser.Parse(
                    { customParser: 3 },
                    ['customParser'] as const,
                    []
                );

                expect(result).toStrictEqual(err('customParser'));
            });
            test('optional value', () => {
                const result = TestModelParser.Parse({ customParser: 3 }, [], [
                    'customParser'
                ] as const);

                expect(result).toStrictEqual(err('customParser'));
            });
        });
        describe('custom error', () => {
            type UserSchema = {
                id: {
                    type: number;
                    nullable: false;
                    default: false;
                };
                username: {
                    type: string;
                    nullable: false;
                    default: false;
                };
            };
            const UserTable: Table<UserSchema> = {
                schemaName: 'public',
                tableName: 'user',
                columns: {
                    id: {
                        type: 'int2',
                        nullable: false,
                        default: false,
                        min: 1
                    },
                    username: {
                        type: 'varchar',
                        nullable: false,
                        default: false
                    }
                }
            };
            const UserModelParser = createModelParser(UserTable, {
                errorsMap: {
                    id: [1],
                    username: [2]
                }
            });

            test('require key', () => {
                const result = UserModelParser.Parse({}, ['id'] as const, []);

                expect(result).toStrictEqual(err([1]));
            });
            test('require value', () => {
                const result = UserModelParser.Parse(
                    { id: 0 },
                    ['id'] as const,
                    []
                );

                expect(result).toStrictEqual(err([1]));
            });
            test('optional value', () => {
                const result = UserModelParser.Parse({ id: -1 }, [], [
                    'id'
                ] as const);

                expect(result).toStrictEqual(err([1]));
            });
        });
        test('ok', () => {
            const result = TestModelParser.Parse(
                {
                    customParser: '1',
                    boolean: 't',
                    int2_withMax: undefined,
                    a: 2
                },
                ['customParser'] as const,
                ['boolean', 'int2_withMin'] as const
            );

            expect(result).toStrictEqual(
                ok({
                    customParser: 1,
                    boolean: true
                })
            );
        });
    });
});
