import type {JoinType} from './types/entity';
import {ReservedExpressionKeys} from './entity';
import type {OrderDirection, PostgresType} from './types/postgres';
import type {ReferenceActions} from './types/table';
import type {TransactionIsolationLevel} from './types/pool';

const toTransactionIsolationLevel = (v: TransactionIsolationLevel) => {
    switch (v) {
        case 'read-committed':
            return 'READ COMMITTED';
        case 'read-uncommitted':
            return 'READ UNCOMMITTED';
        case 'repeatable-read':
            return 'REPEATABLE READ';
        case 'serializable':
            return 'SERIALIZABLE';
    }
};

const toOrderDirection = (v: OrderDirection) => {
    switch (v) {
        case 'asc':
            return 'ASCENDING';
        case 'desc':
            return 'DESCENDING';
    }
};

const toJoinType = (v: JoinType) => {
    switch (v) {
        case 'inner':
            return 'INNER JOIN';
        case 'left':
            return 'LEFT OUTER JOIN';
        case 'right':
            return 'RIGHT OUTER JOIN';
        case 'full':
            return 'FULL OUTER JOIN';
    }
};

const toPostgresType = (v: PostgresType) => {
    switch (v) {
        case 'boolean':
            return 'boolean';
        case 'smallint':
            return 'smallint';
        case 'integer':
            return 'integer';
        case 'bigint':
            return 'bigint';
        case 'real':
            return 'real';
        case 'double precision':
            return 'double precision';
        case 'numeric':
            return 'numeric';
        case 'character':
            return 'character';
        case 'character varying':
            return 'character varying';
        case 'text':
            return 'text';
        case 'uuid':
            return 'uuid';
        case 'time without time zone':
            return 'time without time zone';
        case 'time with time zone':
            return 'time with time zone';
        case 'date':
            return 'date';
        case 'timestamp without time zone':
            return 'timestamp without time zone';
        case 'timestamp with time zone':
            return 'timestamp with time zone';
        case 'json':
            return 'json';
        case 'jsonb':
            return 'jsonb';
    }
};

const toReferenceAction = (v: ReferenceActions) => {
    switch (v) {
        case 'no-action':
            return 'NO ACTION';
        case 'restrict':
            return 'RESTRICT';
        case 'set-null':
            return 'SET NULL';
        case 'set-Default':
            return 'SET DEFAULT';
        case 'cascade':
            return 'CASCADE';
    }
};

const toReservedExpressionKeyDescription = (v: typeof ReservedExpressionKeys[Exclude<keyof typeof ReservedExpressionKeys, keyof unknown[]>]) => {
    switch (v) {
        case 'val':
            return 'wrapped value';
        case '=n':
            return 'is null';
        case '!=n':
            return 'is not null';
        case '=t':
            return 'is true';
        case '=f':
            return 'is false';
        case 'not':
            return 'not of';
        case '+':
            return 'sum';
        case '-':
            return 'minus';
        case '*':
            return 'multiply';
        case '/':
            return 'divide';
        case '||':
            return 'concat';
        case 'and':
            return 'logical and';
        case 'or':
            return 'logical or';
        case '**':
            return 'power';
        case 'fun':
            return 'function';
        case 'swt':
            return 'switch statement';
        case 'col':
            return 'column';
        case 'raw':
            return 'raw statement';
        case '=':
            return 'is equal';
        case '!=':
            return 'is not equal';
        case '>':
            return 'is greater than';
        case '>=':
            return 'is greater-equal than';
        case '<':
            return 'is less than';
        case '<=':
            return 'is less-equal than';
        case 'lk':
            return 'does like';
        case '@>':
            return 'json-contain (@>)';
        case '<@':
            return 'json-contain (<@)';
        case '?':
            return 'json-exist (?)';
        case 'j-':
            return 'json-subtract (-)';
        case 'in':
            return 'is inside of';
        case 'nin':
            return 'is not inside of';
        case 'lka':
            return 'does like all';
        case 'lks':
            return 'does like some';
        case '?|':
            return 'json-does some exist (?|)';
        case '?&':
            return 'json-does all exist (?&)';
        case 'j-a':
            return 'json-subtract all (-)';
        case 'bt':
            return 'is between';
        case 'qry':
            return 'sub-query';
        case 'exists':
            return 'row exists in sub-query'
    }
};

export {
    toTransactionIsolationLevel,
    toOrderDirection,
    toJoinType,
    toPostgresType,
    toReferenceAction,
    toReservedExpressionKeyDescription
};