enum OperatorCode {
    Value = 0,
    IsNull = 1,
    IsNotNull = 2,
    IsTrue = 3,
    IsFalse = 4,
    Not = 5,
    Sum = 6,
    Subtract = 7,
    Multiply = 8,
    Divide = 9,
    Power = 10,
    Concat = 11,
    And = 12,
    Or = 13,
    Function = 14,
    SwitchCase = 15,
    Column = 16,
    Raw = 17,
    Ignore = 18,
    IsEqual = 19,
    IsNotEqual = 20,
    IsGreater = 21,
    IsGreaterEqual = 22,
    IsLess = 23,
    IsLessEqual = 24,
    Between = 25,
    InList = 26,
    NotInList = 27,
    InListSubQuery = 28,
    NotInListSubQuery = 29,
    Like = 30,
    LikeSome = 31,
    LikeAll = 32,
    JsonExist = 33,
    JsonRightExist = 34,
    JsonLeftExist = 35,
    JsonSomeExist = 36,
    JsonAllExist = 37,
    JsonRemove = 38,
    JsonRemoveAll = 39,
    JsonIndex = 40,
    JsonIndexChain = 41,
    JsonIndexText = 42,
    JsonQuery = 43,
    SubQuery = 44,
    SubQueryExist = 45
}

type ArithmeticOperator = '+' | '-' | '*' | '/' | '**';
type JsonOperator = 'j-' | 'j- Array' | '->' | '-> Array' | '->>';
type NullOperator = '= null' | '!= null';
type BooleanOperator = '= true' | '= false';
type CompareOperator = '=' | '!=' | '>' | '>=' | '<' | '<=';
type ListOperator = 'in' | 'not in';
type ListWithSubQueryOperator = 'in sub-query' | 'not in sub-query';
type LikeOperator = 'like' | 'like all' | 'like some';
type BetweenOperator = 'between';
type JsonCompareOperator = '?' | '@>' | '<@' | '?|' | '?&' | '@@';

const OperatorMap: Record<
    | ArithmeticOperator
    | JsonOperator
    | NullOperator
    | BooleanOperator
    | CompareOperator
    | ListOperator
    | ListWithSubQueryOperator
    | LikeOperator
    | BetweenOperator
    | JsonCompareOperator,
    OperatorCode
> = {
    '+': OperatorCode.Sum,
    '-': OperatorCode.Subtract,
    '*': OperatorCode.Multiply,
    '/': OperatorCode.Divide,
    '**': OperatorCode.Power,
    'j-': OperatorCode.JsonRemove,
    'j- Array': OperatorCode.JsonRemoveAll,
    '->': OperatorCode.JsonIndex,
    '-> Array': OperatorCode.JsonIndexChain,
    '->>': OperatorCode.JsonIndexText,
    '= null': OperatorCode.IsNull,
    '!= null': OperatorCode.IsNotNull,
    '= true': OperatorCode.IsTrue,
    '= false': OperatorCode.IsFalse,
    '=': OperatorCode.IsEqual,
    '!=': OperatorCode.IsNotEqual,
    '>': OperatorCode.IsGreater,
    '>=': OperatorCode.IsGreaterEqual,
    '<': OperatorCode.IsLess,
    '<=': OperatorCode.IsLessEqual,
    in: OperatorCode.InList,
    'not in': OperatorCode.NotInList,
    'in sub-query': OperatorCode.InListSubQuery,
    'not in sub-query': OperatorCode.NotInListSubQuery,
    like: OperatorCode.Like,
    'like some': OperatorCode.LikeSome,
    'like all': OperatorCode.LikeAll,
    between: OperatorCode.Between,
    '?': OperatorCode.JsonExist,
    '@>': OperatorCode.JsonRightExist,
    '<@': OperatorCode.JsonLeftExist,
    '?|': OperatorCode.JsonSomeExist,
    '?&': OperatorCode.JsonAllExist,
    '@@': OperatorCode.JsonQuery
};

const Dictionary = {
    OrderDirection: {
        asc: 'ASC',
        desc: 'DESC'
    },
    TransactionIsolationLevel: {
        'read-committed': 'READ COMMITTED',
        'read-uncommitted': 'READ UNCOMMITTED',
        'repeatable-read': 'REPEATABLE READ',
        serializable: 'SERIALIZABLE'
    },
    ReferenceAction: {
        'no-action': 'NO ACTION',
        restrict: 'RESTRICT',
        'set-null': 'SET NULL',
        'set-Default': 'SET DEFAULT',
        cascade: 'CASCADE'
    },
    JoinType: {
        inner: 'INNER JOIN',
        left: 'LEFT OUTER JOIN',
        right: 'RIGHT OUTER JOIN',
        full: 'FULL OUTER JOIN'
    },
    PostgresType: {
        boolean: 'BOOLEAN',
        int2: 'SMALLINT',
        int4: 'INTEGER',
        int8: 'BIGINT',
        float4: 'REAL',
        float8: 'DOUBLE PRECISION',
        decimal: 'NUMERIC',
        char: 'CHARACTER',
        varchar: 'CHARACTER VARYING',
        text: 'TEXT',
        uuid: 'UUID',
        date: 'DATE',
        timestamp: 'TIMESTAMP WITHOUT TIME ZONE',
        timestamptz: 'TIMESTAMP WITH TIME ZONE',
        json: 'JSON',
        jsonb: 'JSONB'
    },
    OperatorDescriptions: {
        [OperatorCode.Value]: 'wrapped value',
        [OperatorCode.IsNull]: 'is null',
        [OperatorCode.IsNotNull]: 'is not null',
        [OperatorCode.IsTrue]: 'is true',
        [OperatorCode.IsFalse]: 'is false',
        [OperatorCode.Not]: 'not of',
        [OperatorCode.Sum]: 'sum',
        [OperatorCode.Subtract]: 'subtract',
        [OperatorCode.Multiply]: 'multiply',
        [OperatorCode.Divide]: 'divide',
        [OperatorCode.Power]: 'power',
        [OperatorCode.Concat]: 'concat',
        [OperatorCode.And]: 'and',
        [OperatorCode.Or]: 'or',
        [OperatorCode.Function]: 'function',
        [OperatorCode.SwitchCase]: 'switch statement',
        [OperatorCode.Column]: 'column',
        [OperatorCode.Raw]: 'raw statement',
        [OperatorCode.Ignore]: 'ignore statement',
        [OperatorCode.IsEqual]: 'is equal',
        [OperatorCode.IsNotEqual]: 'is not equal',
        [OperatorCode.IsGreater]: 'is greater than',
        [OperatorCode.IsGreaterEqual]: 'is greater-equal than',
        [OperatorCode.IsLess]: 'is less than',
        [OperatorCode.IsLessEqual]: 'is less-equal than',
        [OperatorCode.Between]: 'is in between',
        [OperatorCode.InList]: 'is inside of',
        [OperatorCode.NotInList]: 'is not inside of',
        [OperatorCode.InListSubQuery]: 'is inside of sub-query',
        [OperatorCode.NotInListSubQuery]: 'is not inside of sub-query',
        [OperatorCode.Like]: 'does like',
        [OperatorCode.LikeSome]: 'does like some',
        [OperatorCode.LikeAll]: 'does like all',
        [OperatorCode.JsonExist]: 'json-exist (?)',
        [OperatorCode.JsonRightExist]: 'json-contain (@>)',
        [OperatorCode.JsonLeftExist]: 'json-contain (<@)',
        [OperatorCode.JsonSomeExist]: 'json-does some exist (?|)',
        [OperatorCode.JsonAllExist]: 'json-does all exist (?&)',
        [OperatorCode.JsonRemove]: 'json-remove (-)',
        [OperatorCode.JsonRemoveAll]: 'json-remove all (-)',
        [OperatorCode.JsonIndex]: 'json-index access',
        [OperatorCode.JsonIndexChain]: 'json-index chain access',
        [OperatorCode.JsonIndexText]: 'json-index text access',
        [OperatorCode.SubQuery]: 'sub-query',
        [OperatorCode.SubQueryExist]: 'row exists in sub-query'
    }
} as const;

export { OperatorCode, OperatorMap, Dictionary };
export type {
    ArithmeticOperator,
    JsonOperator,
    NullOperator,
    BooleanOperator,
    CompareOperator,
    ListOperator,
    ListWithSubQueryOperator,
    LikeOperator,
    BetweenOperator,
    JsonCompareOperator
};
