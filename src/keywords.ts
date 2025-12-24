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
    Constructor = 15,
    SwitchCase = 16,
    Column = 17,
    Raw = 18,
    Ignore = 19,
    IsEqual = 20,
    IsNotEqual = 21,
    IsGreater = 22,
    IsGreaterEqual = 23,
    IsLess = 24,
    IsLessEqual = 25,
    Between = 26,
    InList = 27,
    NotInList = 28,
    InListSubQuery = 29,
    NotInListSubQuery = 30,
    Like = 31,
    LikeSome = 32,
    LikeAll = 33,
    JsonExist = 34,
    JsonRightExist = 35,
    JsonLeftExist = 36,
    JsonSomeExist = 37,
    JsonAllExist = 38,
    JsonRemove = 39,
    JsonRemoveAll = 40,
    JsonIndex = 41,
    JsonIndexChain = 42,
    JsonIndexText = 43,
    JsonQuery = 44,
    SubQuery = 45,
    SubQueryExist = 46
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
        [OperatorCode.Constructor]: 'constructor',
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
