import type { JoinType } from './types/Entity';
import type { ReferenceActions } from './types/Table';
import type { TransactionIsolationLevel } from './pool';
import type { OrderDirection, PostgresType } from './types/postgres';

type ReservedExpressionKey = (typeof ReservedExpressionKeys)[Exclude<
    keyof typeof ReservedExpressionKeys,
    keyof unknown[]
>];
const ReservedExpressionKeys = [
    'val',
    '=n',
    '!=n',
    '=t',
    '=f',
    'not',
    '+',
    '-',
    '*',
    '/',
    '||',
    'and',
    'or',
    '**',
    'fun',
    'swt',
    'col',
    'raw',
    '=',
    '!=',
    '>',
    '>=',
    '<',
    '<=',
    'lk',
    '@>',
    '<@',
    '?',
    'j-',
    'in',
    'nin',
    'lka',
    'lks',
    '?|',
    '?&',
    'j-a',
    'bt',
    'qry',
    'exists'
] as const;

const TransactionIsolationLevelDic = {
    'read-committed': 'READ COMMITTED',
    'read-uncommitted': 'READ UNCOMMITTED',
    'repeatable-read': 'REPEATABLE READ',
    serializable: 'SERIALIZABLE'
} as const;
const toTransactionMode = (isolationLevel: TransactionIsolationLevel, readOnly: boolean) =>
    TransactionIsolationLevelDic[isolationLevel] + (readOnly ? ' READ ONLY' : ' READ WRITE');

const OrderDirectionDic = {
    asc: 'ASC',
    desc: 'DESC'
} as const;
const toOrderDirection = (dir: OrderDirection) => OrderDirectionDic[dir];

const JoinTypDic = {
    inner: 'INNER JOIN',
    left: 'LEFT OUTER JOIN',
    right: 'RIGHT OUTER JOIN',
    full: 'FULL OUTER JOIN'
} as const;
const toJoinType = (joinType: JoinType) => JoinTypDic[joinType];

const PostgresTypeDic = {
    boolean: 'boolean',
    smallint: 'smallint',
    integer: 'integer',
    bigint: 'bigint',
    real: 'real',
    'double precision': 'double precision',
    numeric: 'numeric',
    character: 'character',
    'character varying': 'character varying',
    text: 'text',
    uuid: 'uuid',
    date: 'date',
    'timestamp without time zone': 'timestamp without time zone',
    'timestamp with time zone': 'timestamp with time zone',
    json: 'json',
    jsonb: 'jsonb'
} as const;
const toPostgresType = (type: PostgresType) => PostgresTypeDic[type];

const ReferenceActionDic = {
    'no-action': 'NO ACTION',
    restrict: 'RESTRICT',
    'set-null': 'SET NULL',
    'set-Default': 'SET DEFAULT',
    cascade: 'CASCADE'
} as const;
const toReferenceAction = (action: ReferenceActions) => ReferenceActionDic[action];

const ReservedExpressionKeyDescriptionDic = {
    val: 'wrapped value',
    '=n': 'is null',
    '!=n': 'is not null',
    '=t': 'is true',
    '=f': 'is false',
    not: 'not of',
    '+': 'sum',
    '-': 'minus',
    '*': 'multiply',
    '/': 'divide',
    '||': 'concat',
    and: 'logical and',
    or: 'logical or',
    '**': 'power',
    fun: 'function',
    swt: 'switch statement',
    col: 'column',
    raw: 'raw statement',
    '=': 'is equal',
    '!=': 'is not equal',
    '>': 'is greater than',
    '>=': 'is greater-equal than',
    '<': 'is less than',
    '<=': 'is less-equal than',
    lk: 'does like',
    '@>': 'json-contain (@>)',
    '<@': 'json-contain (<@)',
    '?': 'json-exist (?)',
    'j-': 'json-subtract (-)',
    in: 'is inside of',
    nin: 'is not inside of',
    lka: 'does like all',
    lks: 'does like some',
    '?|': 'json-does some exist (?|)',
    '?&': 'json-does all exist (?&)',
    'j-a': 'json-subtract all (-)',
    bt: 'is between',
    qry: 'sub-query',
    exists: 'row exists in sub-query'
} as const;
const toReservedExpressionKeyDescription = (key: ReservedExpressionKey) => ReservedExpressionKeyDescriptionDic[key];

export {
    type ReservedExpressionKey,
    ReservedExpressionKeys,
    TransactionIsolationLevelDic,
    toTransactionMode,
    OrderDirectionDic,
    toOrderDirection,
    JoinTypDic,
    toJoinType,
    PostgresTypeDic,
    toPostgresType,
    ReferenceActionDic,
    toReferenceAction,
    ReservedExpressionKeyDescriptionDic,
    toReservedExpressionKeyDescription
};
