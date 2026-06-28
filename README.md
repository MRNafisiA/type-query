# Documentation

# Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Getting Started](#getting-started)
    - [Connecting to the Database](#connecting-to-the-database)
    - [Defining a Table](#defining-a-table)
    - [Defining an Entity](#defining-an-entity)
    - [Performing a SELECT Query](#performing-a-select-query)
    - [Performing an INSERT Query](#performing-an-insert-query)
    - [Performing an UPDATE Query](#performing-an-update-query)
    - [Performing a DELETE Query](#performing-a-delete-query)
    - [Using JOINs](#using-joins)
    - [Defining a Schema](#defining-a-schema)
    - [Defining a Model](#defining-a-model)
    - [Defining a Model Parser](#defining-a-model-parser)
- [API Reference](#api-reference)
    - [Advanced Database Connection](#advanced-database-connection)
    - [Advanced Table Definitions](#advanced-table-definitions)
        - [Column Options Reference](#column-options-reference)
        - [`type` Options Reference](#type-options-reference)
        - [`defaultValue` Options Reference](#defaultvalue-options-reference)
        - [`createReference` Reference](#createreference-reference)
        - [Advanced Table Definitions Example](#advanced-table-definitions-example)
    - [Generating Tables and Sequences SQL](#generating-tables-and-sequences-sql)
        - [Setup and Teardown Database Sequences and Tables](#setup-and-teardown-database-sequences-and-tables)
    - [`execute()` and `getData()`](#execute-and-getdata)
    - [Expression System](#expression-system)
        - [U.compare](#ucompare)
        - [U.arithmetic](#uarithmetic)
        - [U.json](#ujson)
        - [U.fun](#ufun)
        - [U.cons](#ucons)
        - [U.switchCase](#uswitchcase)
        - [U.concat](#uconcat)
        - [U.not](#unot)
        - [U.and](#uand)
        - [U.or](#uor)
        - [U.subQuery](#usubquery)
        - [U.subQueryExist](#usubqueryexist)
        - [U.raw](#uraw)
        - [U.ignore](#uignore)
        - [U.column](#ucolumn)
        - [U.value](#uvalue)
    - [Context](#context)
    - [Execution Mode](#execution-mode)
    - [SELECT Operations](#select-operations)
        - [SELECT Parameter: `returning`](#select-parameter-returning)
        - [SELECT Parameter: `where`](#select-parameter-where)
        - [SELECT Parameter: `selectOptions`](#select-parameter-selectoptions)
            - [SelectOptions.distinct?](#selectoptionsdistinct)
            - [SelectOptions.groupBy?](#selectoptionsgroupby)
            - [SelectOptions.orders?](#selectoptionsorders)
            - [SelectOptions.start?](#selectoptionsstart)
            - [SelectOptions.step?](#selectoptionsstep)
            - [SelectOptions.customQueryBuilder?](#selectoptionscustomquerybuilder)
        - [Example of SELECT Operations](#example-of-select-operations)
    - [INSERT Operations](#insert-operations)
        - [INSERT Parameter: `rows`](#insert-parameter-rows)
        - [INSERT Parameter: `returning`](#insert-parameter-returning)
        - [Example of INSERT Operations](#example-of-insert-operations)
    - [UPDATE Operations](#update-operations)
        - [UPDATE Parameter: `sets`](#update-parameter-sets)
        - [UPDATE Parameter: `where`](#update-parameter-where)
        - [UPDATE Parameter: `returning`](#update-parameter-returning)
        - [Example of UPDATE Operations](#example-of-update-operations)
    - [DELETE Operations](#delete-operations)
        - [DELETE Parameter: `where`](#delete-parameter-where)
        - [DELETE Parameter: `returning`](#delete-parameter-returning)
        - [Example of DELETE Operations](#example-of-delete-operations)
    - [JOIN Operations](#join-operations)
        - [JOIN Parameter: `mainAlias`](#join-parameter-mainalias)
        - [JOIN Parameter: `joinType`](#join-parameter-jointype)
        - [JOIN Parameter: `joinTable`](#join-parameter-jointable)
        - [JOIN Parameter: `joinAlias`](#join-parameter-joinalias)
        - [JOIN Parameter: `on`](#join-parameter-on)
        - [Example of JOIN Operations](#example-of-join-operations)
    - [Transaction Management](#transaction-management)
        - [Transaction Parameter: `pool`](#transaction-parameter-pool)
        - [Transaction Parameter: `callback`](#transaction-parameter-callback)
        - [Transaction Parameter: `isolationLevel?`](#transaction-parameter-isolationlevel)
        - [Transaction Parameter: `readOnly?`](#transaction-parameter-readonly)
        - [Example of Transaction](#example-of-transaction)
    - [Test Transaction Utility (for Unit and E2E Tests)](#test-transaction-utility-for-unit-and-e2e-tests)
        - [Test Transaction Parameter: `tablesWithData`](#test-transaction-parameter-tableswithdata)
        - [Test Transaction Parameter: `callback`](#test-transaction-parameter-callback)
        - [Test Transaction Parameter: `pool`](#test-transaction-parameter-pool)
        - [Test Transaction Parameter: `isolationLevel?`](#test-transaction-parameter-isolationlevel)
        - [Test Transaction Parameter: `rollback?`](#test-transaction-parameter-rollback)
        - [Example of Test Transaction](#example-of-test-transaction)
    - [Json Type](#json-type)

# Introduction

Welcome to the documentation for **Type-Query**, a powerful, type-safe ORM (Object-Relational Mapper) library written in
TypeScript. This library bridges the gap between your TypeScript application and your SQL database with a strong
emphasis on **type safety**, **validation**, and **developer experience**.

Unlike traditional ORMs that rely on reflection or decorators, Type-Query uses a **schema-first** approach. You define
your table structure once, and the library infers TypeScript types, generates validation rules, and provides a fluent
query builder with full IntelliSense support.

**Key Features:**

- **100% Type-Safe:** Enjoy full autocompletion for column names, operators, and return types.
- **Schema Validation:** Define `minLength`, `maxLength`, `regex`, and `nullable` constraints directly within your
  schema.
- **Model Parsing:** Parse and validate incoming API requests before they hit your database with a powerful,
  error-accumulating parser.
- **Fluent Query Builder:** Use intuitive methods for `select`, `insert`, `update`, `delete`, and `join` operations.
- **Custom Operators:** Leverage an advanced expression system for complex `where` clauses.

# Installation

**Peer Dependencies:**

- Install the [pg](https://node-postgres.com) client, as this library is built for PostgreSQL-compatible databases.
- If you intend to use the Postgres `Number` type, install [Decimal.js](https://mikemcl.github.io/decimal.js/) as well.

```bash
bun add @mrnafisia/type-query pg decimal.js
bun add --dev @types/pg
```

```bash
npm install @mrnafisia/type-query pg decimal.js
npm install --save-dev @types/pg
```

```bash
yarn add @mrnafisia/type-query pg decimal.js
yarn add --dev @types/pg
```

# Getting Started

## Connecting to the Database

Type-Query works directly with the [pg](https://node-postgres.com) library.

`db.ts`

```typescript
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: 'postgres://postgres:12345678@localhost:5432/app'
});

export { pool };
```

## Defining a Table

Start by defining your table structure using the `createTable` function. This defines the schema, column types, and
validation rules for the model parser.

`User.ts`

```typescript
import { createTable } from '@mrnafisia/type-query';

const UserTable = createTable({
    schemaName: 'public', //    Database schema
    tableName: 'user', //       Table name
    columns: {
        id: {
            type: 'int4', //    PostgreSQL type
            nullable: false,
            default: true,
            primary: true,
            defaultValue: ['auto-increment'] // Special syntax for SERIAL/IDENTITY
        },
        username: {
            type: 'varchar',
            nullable: false,
            default: false,
            minLength: 1,
            maxLength: 24,
            regex: /^[\w-]*$/ //    Alphanumeric, underscore, or dash
        },
        name: {
            type: 'varchar',
            nullable: true, //      This column can be NULL
            default: false,
            minLength: 6,
            maxLength: 100
        },
        isAdmin: {
            type: 'boolean',
            nullable: false,
            default: true,
            defaultValue: ['js', false]
        },
        isActive: {
            type: 'boolean',
            nullable: false,
            default: false
        },
        roles: {
            type: 'jsonb',
            nullable: false,
            default: false,
            // 'narrowType' helps TypeScript narrow the default pg-to-ts type map (e.g., string[])
            narrowType: undefined as unknown as string[]
        }
    }
});
```

## Defining an Entity

After defining a table, create an **Entity** to perform database operations (SELECT, INSERT, UPDATE, DELETE, and JOIN).

`User.ts`

```typescript
import { createEntity } from '@mrnafisia/type-query';

// UserTable definition ...

const User = createEntity(UserTable);

export { User };
```

The `User` object now provides methods like `.select()`, `.insert()`, `.update()`, `.delete()`, and `.join()`.

## Performing a SELECT Query

Select specific columns without any filters.

```typescript
import { pool } from './db';
import { User } from './User';
import { PoolClient } from 'pg';

const selectUser = async (client: PoolClient) => {
    const result = await User.select(
        ['id', 'username'], //  selecting columns
        true //                 WHERE condition (true means no filter)
    ).execute(client, []);
    if (!result.ok) {
        throw new Error(`Query failed with error ${result.error}`);
    }
    console.log(result.value); // Array of rows: { id: number, username: string }[]
};

pool.connect().then(async client => {
    await selectUser(client);
    client.release();
    await pool.end();
});
```

## Performing an INSERT Query

Insert a single row or multiple rows.

```typescript
import { pool } from './db';
import { User } from './User';
import { PoolClient } from 'pg';

const insertUser = async (client: PoolClient) => {
    const insertingRow = {
        username: 'john_doe',
        name: 'john',
        isActive: true,
        roles: ['reporter', 'writer']
    };

    const result = await User.insert([insertingRow], ['id']).execute(
        client,
        []
    );
    if (!result.ok) {
        throw new Error(`Query failed with error ${result.error}`);
    }
    console.log(result.value); // Array of rows: { id: number }[]
};

pool.connect().then(async client => {
    await insertUser(client);
    client.release();
    await pool.end();
});
```

## Performing an UPDATE Query

Update records that match a condition.

```typescript
import { pool } from './db';
import { User } from './User';
import { PoolClient } from 'pg';

const updateUser = async (client: PoolClient) => {
    const result = await User.update(
        { isActive: true }, //                          Set column values
        context => context.compare('id', '=', 1), //    Condition: WHERE id = 123
        ['id'] //                                       Return the 'id' column of updated rows
    ).execute(client, []);
    if (!result.ok) {
        throw new Error(`Query failed with error ${result.error}`);
    }
    console.log(result.value); //                       Array of rows: { id: number }[]
};

pool.connect().then(async client => {
    await updateUser(client);
    client.release();
    await pool.end();
});
```

## Performing a DELETE Query

Delete records matching a condition.

```typescript
import { pool } from './db';
import { User } from './User';
import { PoolClient } from 'pg';

const deleteUser = async (client: PoolClient) => {
    const result = await User.delete(
        context => context.compare('username', '=', 'john_doe'),
        ['id']
    ).execute(client, []);
    if (!result.ok) {
        throw new Error(`Query failed with error ${result.error}`);
    }
    console.log(result.value); // Array of rows: { id: number }[]
};

pool.connect().then(async client => {
    await deleteUser(client);
    client.release();
    await pool.end();
});
```

## Using JOINs

The library provides a powerful join system that allows you to join multiple tables with type safety.

`Product.ts`

```typescript
import { createTable, createEntity } from '@mrnafisia/type-query';

const Product = createEntity(
    createTable({
        schemaName: 'public',
        tableName: 'product',
        columns: {
            id: {
                type: 'int4',
                nullable: false,
                default: true,
                primary: true,
                defaultValue: ['auto-increment']
            },
            title: {
                type: 'varchar',
                nullable: false,
                default: false
            },
            isDisabled: {
                type: 'boolean',
                nullable: false,
                default: false
            },
            userID: {
                type: 'int4',
                nullable: false,
                default: false
            }
        }
    })
);

export { Product };
```

```typescript
import { pool } from './db';
import { User } from './User';
import { PoolClient } from 'pg';
import { Product } from './Product';

const joinSelect = async (client: PoolClient) => {
    const result = await Product.join(
        'p', //         Alias for the Product table
        'inner', //     Join type: 'inner', 'left', 'right', 'full'
        User.table, //  The table to join with
        'u', //         Alias for the User table
        ({ pContext, uContext }) =>
            pContext.compare('userID', '=', uContext.column('id'))
    )
        .select(
            [
                'u_id', // 'u_id' means: from the User table (alias 'u'), column 'id'
                'u_username',
                'p_id',
                'p_title'
            ],
            ({ pContext }) => pContext.compare('title', '=', 'chair') // WHERE clause
        )
        .execute(client, []);
    if (!result.ok) {
        throw new Error(`Query failed with error ${result.error}`);
    }
    console.log(result.value);
    /* Array of rows: {
     *      u_id: number,
     *      u_username: string,
     *      p_id: number,
     *      p_title: string
     *  }[]
     */
};

pool.connect().then(async client => {
    await joinSelect(client);
    client.release();
    await pool.end();
});
```

## Defining a Schema

**Schema** is a handy type for creating models, complex conditions, expressions, and more.

`User.ts`

```typescript
// UserTable definition ...
// User definition ...
type UserSchema = typeof User.table.columns;

export { type UserSchema };
```

## Defining a Model

A **Model** simplifies working with typed data structures by allowing you to specify required and optional fields.

`User.ts`

```typescript
import { ModelWithPrefix } from '@mrnafisia/type-query';

// UserTable definition ...
// User definition ...
// UserSchema definition ...

type UserModel<
    Required extends keyof UserSchema = keyof UserSchema,
    Optional extends keyof UserSchema = never,
    NotNull extends Required | Optional = never,
    Prefix extends string = ''
> = ModelWithPrefix<UserSchema, Required, Optional, NotNull, Prefix>;

export { type UserModel };
```

Example:

```typescript
import { UserModel } from './User';

type AddUser = UserModel<
    'username' | 'name', // required
    'roles' //              optional
>; // { username: string, name: string | null, roles?: string[] }

type EditUser = UserModel<
    'id', //                            required
    'username' | 'name' | 'roles', //   optional
    'name' //                           null not allowed
>; // { id: number, username?: string, name?: string, roles?: string[] }

type GetUser = UserModel<
    'id', //                            required
    'username' | 'name' | 'roles', //   optional
    never,
    'u_' //                             alias when selecting using join
>; // { u_id: number, u_username?: string, u_name?: string, u_roles?: string[] }
```

## Defining a Model Parser

A **Model Parser** validates and transforms raw input data into typed application models.

`User.ts`

```typescript
import { createModelParser } from '@mrnafisia/type-query';

// UserTable definition ...
// User definition ...
// UserSchema definition ...
// UserModel definition ...

const UserModelParser = createModelParser(User.table, {
    errorsMap: {
        //  Map database columns to user-friendly error messages
        id: 'Invalid ID format.',
        username:
            'Username must be 1-24 characters and contain only letters, numbers, underscores, or dashes.',
        name: 'Please provide a valid name.',
        isAdmin: 'invalid isAdmin',
        isActive: 'invalid isActive',
        roles: 'At most 5 roles are allowed.'
    },
    parsers: {
        //  Custom parsing logic for specific columns
        roles: v => (v.length < 5 ? v : undefined)
    }
});

export { UserModelParser };
```

Parsing an entire object:

```typescript
import { UserModelParser } from './User';

const data = { id: 1 };

const result = UserModelParser.Parse(
    data, //            data must be at least in the form of Record<string, unknown>
    ['id', 'name'], //  required
    ['username'], //    optional
    ['name'] //         null not allowed
);
if (!result.ok) {
    throw new Error(result.error); //      'Please provide a valid name.'
}
console.log(result.value); //   { id: number, name: string, username?: string }
```

Parsing a single field:

```typescript
import { UserModelParser } from './User';

const username = 'admin';

const parsedUsername = UserModelParser.username(username);
if (parsedUsername === undefined) {
    throw new Error('username is invalid.');
}
console.log(parsedUsername); // 'admin'
```

# API Reference

## Advanced Database Connection

`db.ts`

```typescript
import Decimal from 'decimal.js';
import { Pool, Query, types } from 'pg';

// (REQUIRED) Improve the pg parser (refer to the pg documentation for more details)
types.setTypeParser(types.builtins.INT8, v => BigInt(v));
types.setTypeParser(types.builtins.NUMERIC, v => new Decimal(v));
types.setTypeParser(types.builtins.DATE, v => new Date(`${v}T00:00:00Z`));

// (OPTIONAL) Log all executed queries to the console
if (process.env.NODE_ENV === 'development') {
    const submit = Query.prototype.submit;
    Query.prototype.submit = function (
        this: Record<'text' | 'values', string>
    ) {
        console.info(`\x1b[36mQuery: ${this.text}`);
        console.info(`Parameters: ${JSON.stringify(this.values)}\x1b[0m\n`);
        submit.apply(this, arguments as unknown as Parameters<typeof submit>);
    };
}

// Create a pg Pool
const pool = new Pool({
    connectionString: 'postgres://postgres:12345678@localhost:5432/app'
});

export { pool };
```

## Advanced Table Definitions

The `createTable` function supports a wide range of column options for rigorous data integrity.

### Column Options Reference

| Option           | Type                                    | Description                                                                                                                                                             |
| ---------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`           | `string`                                | See the [type Options Reference](#type-options-reference).                                                                                                              |
| `nullable`       | `boolean`                               | If `true`, the column can store `NULL` values.                                                                                                                          |
| `primary?`       | `true`                                  | Marks the column as a primary key. Applicable only if the column is not null.                                                                                           |
| `default`        | `boolean`                               | Indicates whether a default value exists.                                                                                                                               |
| `defaultValue?`  |                                         | Applicable only if `default: true`. See the [`defaultValue` Options Reference](#defaultvalue-options-reference).                                                        |
| `min?`           | `number` \| `Decimal` (depends on type) | (For Integer, Float and Decimal kinds only) Minimum allowed value.                                                                                                      |
| `max?`           | `number` \| `Decimal` (depends on type) | (For Integer, Float and Decimal kinds only) Maximum allowed value.                                                                                                      |
| `minLength?`     | `number`                                | (For String kind only) Minimum string length.                                                                                                                           |
| `maxLength?`     | `number`                                | (For String kind only) Maximum string length.                                                                                                                           |
| `regex?`         | `RegExp`                                | (For String kind only) Regular expression pattern the value must match.                                                                                                 |
| `sequenceTitle?` | `string`                                | A custom title for the related sequence. Applicable only if `defaultValue` is `['auto-increment']`.                                                                     |
| `precision`      | `number`                                | Refer to the [pg documentation](https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-NUMERIC-DECIMAL). Applicable only if `type` is `decimal`.        |
| `scale`          | `number`                                | Refer to the [pg documentation](https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-NUMERIC-DECIMAL). Applicable only if `type` is `decimal`.        |
| `length`         | `number`                                | Refer to the [pg documentation](https://www.postgresql.org/docs/current/datatype-datetime.html). Applicable only if `type` is `'date' \| 'timestamp' \| 'timestamptz'`. |
| `narrowType?`    |                                         | Helps narrow the base type. (e.g. `1 \| 2 \| 3` for an `int2` type or `'allow' \| 'deny'` for a `string` type)                                                          |
| `reference?`     |                                         | Defines a foreign key. See the [`createReference` Reference](#createreference-reference).                                                                               |

### `type` Options Reference

| Kind          | PG Type             | JS Type                                       | Description                                      |
| ------------- | ------------------- | --------------------------------------------- | ------------------------------------------------ |
| **Boolean**   | `boolean`           | `boolean`                                     |                                                  |
| **Integer**   | `int2`              | `number`                                      |                                                  |
| **Integer**   | `int4`              | `number`                                      |                                                  |
| **Integer**   | `int8`              | `number`                                      |                                                  |
| **Float**     | `float4`            | `number`                                      |                                                  |
| **Float**     | `float8`            | `number`                                      |                                                  |
| **Decimal**   | `decimal`           | `Decimal`                                     |                                                  |
| **String**    | `char`              | `string`                                      |                                                  |
| **String**    | `varchar`           | `string`                                      |                                                  |
| **String**    | `text`              | `string`                                      |                                                  |
| **String**    | `uuid`              | `string`                                      |                                                  |
| **Date**      | `date`              | `Date`                                        |                                                  |
| **Date/Time** | `timestamp`         | `Date`                                        |                                                  |
| **Date/Time** | `timestamptz`       | `Date`                                        |                                                  |
| **JSON**      | `json`              | `Json`                                        | See [Json Type](#json-type)                      |
| **JSON**      | `jsonb`             | `Json`                                        | See [Json Type](#json-type)                      |
| **Custom**    | `custom(something)` | Use the `narrowType` definition in the table. | For example, `custom(Circle)` or any custom type |

### `defaultValue` Options Reference

| Type            | defaultValue Type                                                              |
| --------------- | ------------------------------------------------------------------------------ |
| **boolean**     | `['sql', string]` \| `['js', boolean]`                                         |
| **int2**        | `['sql', string]` \| `['js', number]` \| `['auto-increment']`                  |
| **int4**        | `['sql', string]` \| `['js', number]` \| `['auto-increment']`                  |
| **int8**        | `['sql', string]` \| `['js', number]` \| `['auto-increment']`                  |
| **float4**      | `['sql', string]` \| `['js', number]`                                          |
| **float8**      | `['sql', string]` \| `['js', number]`                                          |
| **decimal**     | `['sql', string]` \| `['js', Decimal]`                                         |
| **char**        | `['sql', string]` \| `['js', string]`                                          |
| **varchar**     | `['sql', string]` \| `['js', string]`                                          |
| **text**        | `['sql', string]` \| `['js', string]`                                          |
| **uuid**        | `['sql', string]` \| `['js', string]`                                          |
| **date**        | `['sql', string]` \| `['js', Date]` \| `['created-at']` \| `['updated-at']`    |
| **timestamp**   | `['sql', string]` \| `['js', Date]` \| `['created-at']` \| `['updated-at']`    |
| **timestamptz** | `['sql', string]` \| `['js', Date]` \| `['created-at']` \| `['updated-at']`    |
| **json**        | `['sql', string]` \| `['js', Json]` (See [Json Type](#json-type))              |
| **jsonb**       | `['sql', string]` \| `['js', Json]` (See [Json Type](#json-type))              |
| **Custom**      | `['sql', string]` \| `['js', inherits the narrowType definition in the table]` |

### `createReference` Reference

References are used to define foreign keys.

```typescript
import { User } from './User';
import {
    createTable,
    createEntity,
    createReference
} from '@mrnafisia/type-query';

const Token = createEntity(
    createTable({
        schemaName: 'public',
        tableName: 'token',
        columns: {
            uuid: {
                type: 'uuid',
                nullable: false,
                default: false,
                primary: true
            },
            userID: {
                type: 'int4',
                nullable: false,
                default: false,
                reference: createReference({
                    table: User.table,
                    column: 'id',
                    onDelete: 'no-action',
                    onUpdate: 'restrict'
                })
            }
        }
    })
);
```

### Advanced Table Definitions Example

```typescript
import Decimal from 'decimal.js';
import { createEntity, createTable } from '@mrnafisia/type-query';

const Price = createEntity(
    createTable({
        schemaName: 'public',
        tableName: 'token',
        columns: {
            id: {
                type: 'int4',
                nullable: false,
                default: true,
                primary: true,
                min: 1,
                defaultValue: ['auto-increment']
            },
            title: {
                type: 'varchar',
                nullable: false,
                default: false,
                minLength: 3,
                maxLength: 255
            },
            price: {
                type: 'decimal',
                nullable: false,
                default: true,
                precision: 25,
                scale: 15,
                defaultValue: ['js', new Decimal(0)]
            },
            type: {
                type: 'varchar',
                nullable: false,
                default: false,
                narrowType: undefined as unknown as
                    | 'retail'
                    | 'wholesale'
                    | 'mass-production'
            },
            createdAt: {
                type: 'timestamptz',
                nullable: false,
                default: true,
                defaultValue: ['sql', 'now()']
            }
        }
    })
);
```

## Generating Tables and Sequences SQL

```typescript
import { User } from './User';
import {
    generateDropTableSQL,
    generateCreateTableSQL,
    generateDropSequencesSQL,
    generateCreateSequencesSQL
} from '@mrnafisia/type-query';

const createSequencesSQL: string[] = generateCreateSequencesSQL(User.table, {
    applyIfNotExist: true, //   Optional: apply CREATE SEQUENCE IF NOT EXISTS
    owner: 'app_admin' //       Optional: change owner to: app_admin
});

const dropSequencesSQL: string[] = generateDropSequencesSQL(User.table, {
    applyIfExist: true //       Optional: apply DROP SEQUENCE IF EXISTS
});

const createTableSQL: string = generateCreateTableSQL(User.table, {
    applyIfNotExist: true, //   Optional: apply CREATE TABLE IF NOT EXISTS
    isTemp: true, //            Optional: apply CREATE TEMPORARY TABLE
    owner: 'app_admin' //       Optional: change owner to: app_admin
});

const dropTableSQL: string = generateDropTableSQL(User.table, {
    applyIfExist: true //       Optional: apply DROP TABLE IF EXISTS
});
```

### Setup and Teardown Database Sequences and Tables

`ddl.ts`

```typescript
import { pool } from './db';
import { User } from './User';
import {
    generateDropTableSQL,
    generateCreateTableSQL,
    generateDropSequencesSQL,
    generateCreateSequencesSQL
} from '@mrnafisia/type-query';

const Tables = [User.table];

const setupDatabaseSequencesAndTables = () =>
    pool
        .connect()
        .then(client =>
            client
                .query(
                    Tables.flatMap(table => [
                        ...generateCreateSequencesSQL(table),
                        generateCreateTableSQL(table)
                    ]).join(';\n') + ';'
                )
                .finally(() => client.release())
        );

const teardownDatabaseSequencesAndTables = () =>
    pool
        .connect()
        .then(client =>
            client
                .query(
                    Tables.flatMap(table => [
                        ...generateDropSequencesSQL(table),
                        generateDropTableSQL(table)
                    ]).join(';\n') + ';'
                )
                .finally(() => client.release())
        );

export {
    Tables,
    setupDatabaseSequencesAndTables,
    teardownDatabaseSequencesAndTables
};
```

## `execute()` and `getData()`

A complete query object exposes two methods: **`getData()`** and **`execute()`**. Both methods prepare the query and its associated parameters.

- **`getData()`** returns the prepared query in the form `Result<{ sql: string, params: string[] }, unknown>`. This is useful for debugging, logging, or inspecting the generated SQL before execution.  
  For more details, check out [never-catch](https://github.com/MRNafisiA/never-catch) (inspired by the [Rust](https://rust-lang.org/) `Result` enum).
- **`execute()`** runs the query against the database using the provided `PoolClient`.

Both methods may return an error if a problem is detected in the query (e.g., a neutral expression or an invalid configuration).

## Expression System

Type-Query provides a rich set of utilities to create complex expressions and `where` clauses. The `U` object must be
used exclusively within Type-Query functions and contexts. **Do not** mix it with other JavaScript code.

### U.compare

Use `U.compare` to compare two values using a variety of operators.

| Operators                                             | Expression Type                                         | Example                                                                                                                                                                       |
| ----------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'= null'` \| `'!= null'`                             | `null`                                                  | `U.compare(null, '!= null')`                                                                                                                                                  |
| `'= true'` \| `'= false'`                             | `boolean`                                               | `U.compare(false, '= true')`                                                                                                                                                  |
| `'='` \| `'!='` \| `'>'` \| `'>='` \| `'<'` \| `'<='` | `number` \| `bigint` \| `Decimal` \| `string` \| `Date` | `U.compare(1, '=', 2)`, `U.compare(BigInt(1), '!=', BigInt(2))`, `U.compare(new Decimal(1.1), '>', new Decimal(2.2))`                                                         |
| `'in'` \| `'not in'`                                  | `number` \| `bigint` \| `Decimal` \| `string` \| `Date` | `U.compare('a', 'in', ['b', 'c'])`, `U.compare(new Date('2000-01-01T00:00:00.000Z'), 'not in', [new Date('2000-01-02T00:00:00.000Z'), new Date('2000-01-03T00:00:00.000Z')])` |
| `'in sub-query'` \| `'not in sub-query'`              | `number` \| `bigint` \| `Decimal` \| `string` \| `Date` | `U.compare(1, 'in sub-query', User.select(['id'], true))`                                                                                                                     |
| `'like'` \| `'like all'` \| `'like some'`             | `string`                                                | `U.compare('a', 'like', '%b%')`, `U.compare('a', 'like all', ['%b%', 'c'])`, `U.compare('a', 'like some', ['%b%', 'c'])`                                                      |
| `'between'`                                           | `number` \| `bigint` \| `Decimal` \| `string` \| `Date` | `U.between(1, 'between', 2, 3)`, `U.between(new Date('2000-01-01T00:00:00.000Z'), 'between', new Date('2000-01-02T00:00:00.000Z'), new Date('2000-01-03T00:00:00.000Z'))`     |
| `'='` \| `'!='` \| `'@>'` \| `'<@'`                   | `Json` (See [Json Type](#json-type))                    | `U.compare('{ "name": "john" }', '=', '{ "age": 12 }')`, `U.compare('["blue", "red", "yellow"]', '@>', '["red"]')`                                                            |
| `'?'` \| `'?\|'` \| `'?&'` \| `'@@'`                  | `Json` (See [Json Type](#json-type))                    | `U.compare('["blue", "green", "red"]', '?', "yellow")`, `U.compare('["blue", "green", "red"]', '?&', '["yellow"]')`                                                           |

Example:

```typescript
import { User } from './User';
import { U } from '@mrnafisia/type-query';

console.log(User.select(['id'], U.compare(1, '=', 2)).getData());
```

### U.arithmetic

Use `U.arithmetic` to apply an arithmetic operator to two values.

| Operators                                  | Expression Type                   | Example                                                                                                                                       |
| ------------------------------------------ | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `'+'` \| `'-'` \| `'*'` \| `'/'` \| `'**'` | `number` \| `bigint` \| `Decimal` | `U.arithmetic(1, '+', 2)` (= 3), `U.arithmetic(1, '+', [2, 3])` (= 6), `U.arithmetic(2, '*', 3)` (= 6), `U.arithmetic(2, '*', [3, 4])` (= 24) |

Example:

```typescript
import { User } from './User';
import { U } from '@mrnafisia/type-query';

console.log(
    User.select(['id'], U.compare(1, '=', U.arithmetic(2, '+', 3))).getData()
);
```

### U.json

Use `U.json` to apply `jsonb`/`json`-specific operators.

| Operators                                                   | Expression Type                      | Example                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'j-'` \| `'j- Array'` \| `'->'` \| `'-> Array'` \| `'->>'` | `Json` (See [Json Type](#json-type)) | `U.json('{ "name": "john" }', 'j-', 'name')`, `U.json('{ "name": "john" }', '->', 'name')`, `U.json('{ "name": { "first": "John", "last": "Diggle" } }', '-> Array', ['name', 'diggle'])` |

Example:

```typescript
import { User } from './User';
import { U } from '@mrnafisia/type-query';

console.log(
    User.select(
        ['id'],
        U.compare('John', '=', U.json({ name: 'John' }, '->>', 'name'))
    ).getData()
);
```

### U.fun

Use `U.fun` to call an SQL function.

```typescript
import { User } from './User';
import { U } from '@mrnafisia/type-query';

console.log(
    User.select(
        ['id'],
        U.compare(
            12,
            '=',
            U.fun(
                'SUBSTRING', //         Function name
                ['AB123', 3, 4], //     Function parameters
                '::INTEGER' //          SQL cast
            ) as number //              Explicit casting is needed as Type-Query doesn't know the SQL function signature
        )
    ).getData()
);
```

### U.cons

Use `U.cons` to call an SQL constructor.

```typescript
import { User } from './User';
import { U } from '@mrnafisia/type-query';

console.log(
    User.select(
        ['id'],
        U.compare(
            1,
            '=',
            U.fun('ANY', [
                U.cons(
                    'ARRAY', //     Constructor name
                    [1, 2, 3] //    Elements
                ) as number[] //    Explicit casting is needed as Type-Query doesn't know the SQL constructor signature
            ]) as number
        )
    ).getData()
);
```

### U.switchCase

Use `U.switchCase` to define an SQL `CASE` expression.

```typescript
import { User } from './User';
import { U } from '@mrnafisia/type-query';

console.log(
    User.select(
        ['id'],
        U.compare(
            1,
            '=',
            U.switchCase(
                [
                    {
                        //  Case 1
                        when: U.compare(2, '=', 3),
                        then: 4
                    },
                    {
                        //  Case 2
                        when: U.compare(5, '=', 6),
                        then: 7
                    }
                ],
                8 // Default value
            )
        )
    ).getData()
);
```

### U.concat

Use `U.concat` to concatenate strings and JSON values.

| Expression Type                      | Example                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| `string`                             | `U.concat('hello', ' ', 'world!')`                                             |
| `Json` (See [Json Type](#json-type)) | `U.concat('["John"], ["Sam"])`, `U.concat('{"name": "John" }', '{"age": 10}')` |

Example:

```typescript
import { User } from './User';
import { U } from '@mrnafisia/type-query';

console.log(
    User.select(['id'], U.compare('John', '=', U.concat('Jo', 'hn'))).getData()
);
```

### U.not

Use `U.not` to negate a boolean expression.

```typescript
import { User } from './User';
import { U } from '@mrnafisia/type-query';

console.log(User.select(['id'], U.not(U.compare(1, '=', 1))).getData());
```

### U.and

Use `U.and` to apply a logical `AND` to multiple boolean expressions.

```typescript
import { User } from './User';
import { U } from '@mrnafisia/type-query';

console.log(
    User.select(
        ['id'],
        U.and(U.compare(1, '=', 1), false, U.compare('A', '!=', 'A'))
    ).getData()
);
```

### U.or

Use `U.or` to apply a logical `OR` to multiple boolean expressions.

```typescript
import { User } from './User';
import { U } from '@mrnafisia/type-query';

console.log(
    User.select(
        ['id'],
        U.or(U.compare(1, '=', 1), false, U.compare('A', '!=', 'A'))
    ).getData()
);
```

### U.subQuery

Use `U.subQuery` to create a sub-query.  
**Hint:** Prefer using [U.compare](#ucompare) with the `in sub-query` operator instead.

```typescript
import { User } from './User';
import { U } from '@mrnafisia/type-query';

console.log(
    User.select(
        ['id'],
        U.compare(1, 'in', U.subQuery<number[]>(User.select(['id'], true)))
    ).getData()
);
```

### U.subQueryExist

Use `U.subQueryExist` to create an `EXISTS` sub-query.

```typescript
import { User } from './User';
import { U } from '@mrnafisia/type-query';

console.log(
    User.select(['id'], U.subQueryExist(User.select(['id'], true))).getData()
);
```

### U.raw

Use `U.raw` to bypass Type-Query and write raw SQL directly into the query text. Use the function form if you need to
use a parameterized query. Ensure you follow the `paramsStart` number to avoid mixing up parameters with others in the
query.

```typescript
import { User } from './User';
import { U } from '@mrnafisia/type-query';

console.log(
    User.select(['id'], context =>
        U.compare(
            U.raw<Date>(paramsStart => ({
                expression: `($${paramsStart++} + $${paramsStart++})`,
                params: ['2000-01-01T00:00:00.000Z', '2000-01-02T00:00:00.000Z']
            })),
            '>',
            U.raw<Date>('(SELECT NOW())')
        )
    ).getData()
);
```

### U.ignore

`U.ignore` is one of the magical utilities in Type-Query that provides absolute safety and saves you a ton of
boilerplate code.

There are certain scenarios that create **neutral** expressions, which can silently affect your queries:

- `context.compare('id', 'in', ids)` - What happens if `ids` is an empty array?
- `context.columnsAnd({ username: ['like some', targets] })` - What happens if `targets` is an empty array?
- `U.and(...rules)` - What happens if `rules` is an empty array?

We call these **neutral** expressions, and there is no way to catch them at compile time.

By default, Type-Query will create a **run-time error** when it receives a neutral expression instead of simply ignoring
it. This is the safe behavior. While it ensures confidence that an entire table's rows will not be deleted if you pass a
neutral condition to a `delete` query, it can become a nightmare in `select` queries that involve many optional filters.

Use `U.ignore` to wrap an expression and safely ignore any neutral expressions within it.

```typescript
import { User } from './User';
import { U } from '@mrnafisia/type-query';

const ids: number[] = [];
const usernames: string[] = [];
const names: string[] = [];

console.log(
    User.select(['id'], context =>
        U.ignore(
            U.and(
                context.compare('id', 'in', ids),
                context.compare('username', 'like all', usernames),
                context.compare('name', 'like all', names)
            ),
            true // Fallback expression if the entire expression is neutral (e.g., no filters provided).
        )
    ).getData()
);
```

### U.column

Use `U.column` to access the columns of a table.  
**Hint:** This is a low-level API and is used internally. Prefer using `context.column` instead.

| Parameters | Type      | Description                                                                                                     |
| ---------- | --------- | --------------------------------------------------------------------------------------------------------------- |
| `table`    | `Table`   | The table definition.                                                                                           |
| `column`   | `string`  | The column name.                                                                                                |
| `full?`    | `boolean` | The full form, which includes the schema and table name as a prefix.                                            |
| `alias?`   | `string`  | An alias to replace the schema and table name. Useful when using aliases for tables in JOIN and SELECT queries. |

Example:

```typescript
import { User } from './User';
import { U } from '@mrnafisia/type-query';

console.log(
    User.select(
        ['id'],
        U.compare(U.column(User.table, 'id', false), '=', 1)
    ).getData()
);
```

### U.value

Use `U.value` to wrap a value explicitly. Generally, Type-Query detects types properly, and there is usually no need to
wrap your values.  
**Attention:** USING `U.value` IS **REQUIRED ONLY WHEN PASSING A JSON ARRAY**. (Why? It interferes with Type-Query's
internal type system.)

```typescript
import { User } from './User';
import { U } from '@mrnafisia/type-query';

console.log(
    User.select(
        ['id'],
        U.and(
            U.compare(
                U.value(1), //          Unnecessary wrapping
                '=',
                2
            ),
            U.compare(
                U.value(['green']), //  Correct and required wrapping
                '=',
                ['blue', 'red'] //      Unwrapped value when wrapping is necessary. This causes unexpected behavior!
            )
        )
    ).getData()
);
```

## Context

The `context` object provides access to table columns and allows you to create advanced `where` clauses and expressions.
Methods like `context.compare`, `context.columnsAnd` and `context.columnsOr` follow the same signature as the `U`
functions.

```typescript
import { User } from './User';
import { U } from '@mrnafisia/type-query';

console.log(
    User.select(['id'], context =>
        U.and(
            U.compare(context.column('id'), '=', 1),
            context.compare('id', '=', 1),
            context.columnsAnd({
                id: ['=', 1],
                name: ['like', 'John%']
            }),
            context.columnsOr({
                id: ['=', 1],
                isAdmin: ['= true']
            })
        )
    ).getData()
);
```

For reusability, you can define a `where` clause separately.

```typescript
import { type UserSchema, User } from './User';
import { U, type Context } from '@mrnafisia/type-query';

const where = (context: Context<UserSchema>) =>
    U.and(
        U.compare(context.column('id'), '=', 1),
        context.compare('id', '=', 1),
        context.columnsAnd({
            id: ['=', 1],
            name: ['like', 'John%']
        }),
        context.columnsOr({
            id: ['=', 1],
            isAdmin: ['= true']
        })
    );

console.log(User.select(['id'], where).getData());
```

## Execution Mode

Type-Query returns a `Result<V, E>` as output for all queries (select, insert, update, delete). For more details, check
out [never-catch](https://github.com/MRNafisiA/never-catch) (inspired by the [Rust](https://rust-lang.org/) `Result`
enum).

Execution mode is a post-query operation that controls the output type and helps you remove boilerplate code.

Example: `['get', 1]`

```typescript
import { pool } from './db';
import { User } from './User';
import { PoolClient } from 'pg';

const selectUser = async (client: PoolClient) => {
    const result = await User.select(['id'], true).execute(client, ['get', 1]);
    if (!result.ok) {
        console.log('Query failed!');
        if (result.error === false) {
            console.log(
                'The query was successful on the database, but the number of fetched rows was not 1.'
            );
        } else {
            console.log(`Database failed with error: ${result.error}`);
        }
    } else {
        console.log('Query succeeded and the number of fetched rows is 1.');
        console.log(result.value); // { "id" }
    }
};

pool.connect().then(async client => {
    await selectUser(client);
    client.release();
    await pool.end();
});
```

Example: `['get', Exclude<number, 1>]`

```typescript
import { pool } from './db';
import { User } from './User';
import { PoolClient } from 'pg';

const selectUser = async (client: PoolClient) => {
    const result = await User.select(['id'], true).execute(client, ['get', 5]);
    if (!result.ok) {
        console.log('Query failed!');
        if (result.error === false) {
            console.log(
                'The query was successful on the database, but the number of fetched rows was not 5.'
            );
        } else {
            console.log(`Database failed with error: ${result.error}`);
        }
    } else {
        console.log('Query succeeded and the number of fetched rows is 5.');
        console.log(result.value[0]); // First element: { "id" }
        console.log(result.value[3]); // Fourth element: { "id" }
    }
};

pool.connect().then(async client => {
    await selectUser(client);
    client.release();
    await pool.end();
});
```

Example: `['count', 2]`

```typescript
import { pool } from './db';
import { User } from './User';
import { PoolClient } from 'pg';

const selectUser = async (client: PoolClient) => {
    const result = await User.select(['id'], true).execute(client, [
        'count',
        2
    ]);
    if (!result.ok) {
        console.log('Query failed!');
        if (result.error === false) {
            console.log(
                'The query was successful on the database, but the number of fetched rows was not 2.'
            );
        } else {
            console.log(`Database failed with error: ${result.error}`);
        }
    } else {
        console.log('Query succeeded and the number of fetched rows is 2.');
        console.log(result.value); // undefined
    }
};

pool.connect().then(async client => {
    await selectUser(client);
    client.release();
    await pool.end();
});
```

Example: `[]`

```typescript
import { pool } from './db';
import { User } from './User';
import { PoolClient } from 'pg';

const selectUser = async (client: PoolClient) => {
    const result = await User.select(['id'], true).execute(client, []);
    if (!result.ok) {
        console.log(
            `Query failed! Database failed with error: ${result.error}`
        );
    } else {
        console.log('Query succeeded.');
        console.log(result.value[0]); // First element: { "id" }
        console.log(result.value[3]); // Fourth element: { "id" }
    }
};

pool.connect().then(async client => {
    await selectUser(client);
    client.release();
    await pool.end();
});
```

## SELECT Operations

### SELECT Parameter: `returning`

`returning` is an array of columns to return. You can pass the array directly (`R`) or use a generator function to
access the context (`context => R[]`). The returning parameter can be columns directly (e.g., `'id'`) or virtual columns
like `{ name: 'avg', expression: U.fun('AVERAGE', [context.column('age')]) }`.

### SELECT Parameter: `where`

`where` is a boolean expression that is checked for every row. You can pass the condition directly (e.g., `true`) or use
a generator function to access the context (e.g., `context => boolean`).

### SELECT Parameter: `selectOptions`

#### SelectOptions.distinct?

If `distinct` is `true`, Type-Query uses `DISTINCT` in the final query. If you pass an array of columns, Type-Query uses
`DISTINCT ON ()` in the final query. You can pass a custom expression instead of direct columns in the form of
`{ expression: value }`. You can also use a generator function to access the context.

#### SelectOptions.groupBy?

You can pass an array of columns or a custom expression directly, or use a generator function to access the context.

#### SelectOptions.orders?

You can pass an array of `Order` objects to specify your column or expression, the sort direction, and the null position
directly, or use a generator function to access the context.

#### SelectOptions.start?

`start` specifies how many of the first rows to skip. The default is `0`.

#### SelectOptions.step?

`step` specifies how many rows to fetch. The default is all rows.

#### SelectOptions.customQueryBuilder?

`customQueryBuilder` gives you full access to the query-building mechanism. If using `U.raw` does not meet your needs,
you can use `customQueryBuilder` for writing CTEs, complex sub-queries, recursive queries, and more. Type-Query provides
a default `customQueryBuilder` that you can call with your changes or rewrite entirely from scratch.

```typescript
type CustomQueryBuilder = (
    parts: Record<
        `${'distinct' | 'returning' | 'from' | 'where' | 'groupBy' | 'orders' | 'pagination'}Part`,
        string
    >,
    params: string[]
) => { sql: string; params: string[] };

const defaultCustomQueryBuilder: CustomQueryBuilder = (parts, params) => {
    const tokens = ['SELECT'];
    if (parts.distinctPart !== '') {
        tokens.push(parts.distinctPart);
    }
    tokens.push(
        parts.returningPart,
        'FROM',
        parts.fromPart,
        'WHERE',
        parts.wherePart
    );
    if (parts.groupByPart !== '') {
        tokens.push('GROUP BY', parts.groupByPart);
    }
    if (parts.ordersPart !== '') {
        tokens.push('ORDER BY', parts.ordersPart);
    }
    if (parts.paginationPart !== '') {
        tokens.push(parts.paginationPart);
    }

    return {
        sql: tokens.join(' '),
        params
    };
};
```

### Example of SELECT Operations

Example 1:

```typescript
import { pool } from './db';
import { User } from './User';
import { PoolClient } from 'pg';
import { U } from '@mrnafisia/type-query';

const selectUser = async (client: PoolClient) => {
    const result = await User.select(
        context => [
            'id',
            'name',
            {
                name: 'isActiveAndIsAdmin',
                expression: U.and(
                    context.column('isActive'),
                    context.column('isAdmin')
                )
            }
        ],
        context => context.compare('username', 'like', 'john%'),
        {
            distinct: true,
            orders: context => [
                {
                    by: 'name',
                    direction: 'desc',
                    nullPosition: 'last'
                },
                {
                    by: {
                        expression: U.and(
                            context.column('isActive'),
                            context.column('isAdmin')
                        )
                    },
                    direction: 'desc'
                }
            ],
            start: BigInt(30),
            step: 25
        }
    ).execute(client, []);
    if (!result.ok) {
        throw new Error(`Query failed with error ${result.error}`);
    }
    console.log(result.value);
    /*  Array of rows: {
     *       id: number,
     *       name: string | null,
     *       isActiveAndIsAdmin: boolean
     *   }[]
     */
};

pool.connect().then(async client => {
    await selectUser(client);
    client.release();
    await pool.end();
});
```

Example 2:

```typescript
import { pool } from './db';
import { User } from './User';
import { PoolClient } from 'pg';
import { U } from '@mrnafisia/type-query';

const selectUser = async (client: PoolClient) => {
    const result = await User.select(
        context => [
            'name',
            {
                name: 'isActiveAndIsAdmin',
                expression: U.and(
                    context.column('isActive'),
                    context.column('isAdmin')
                )
            }
        ],
        true,
        {
            distinct: ['name'],
            groupBy: context => [
                'name',
                {
                    expression: U.and(
                        context.column('isActive'),
                        context.column('isAdmin')
                    )
                }
            ]
        }
    ).execute(client, []);
    if (!result.ok) {
        throw new Error(`Query failed with error ${result.error}`);
    }
    console.log(result.value);
    /*  Array of rows: {
     *       name: string | null,
     *       isActiveAndIsAdmin: boolean
     *   }[]
     */
};

pool.connect().then(async client => {
    await selectUser(client);
    client.release();
    await pool.end();
});
```

## INSERT Operations

### INSERT Parameter: `rows`

Default and nullable columns are optional in `rows`. The priority is: the value specified in `rows`, then the default
value, and then `null`. You can pass the `rows` directly or use a generator function to access the context.

### INSERT Parameter: `returning`

See [SELECT Parameter: `returning`](#select-parameter-returning).

### Example of INSERT Operations

```typescript
import { pool } from './db';
import { User } from './User';
import { PoolClient } from 'pg';

const insertUser = async (client: PoolClient) => {
    const result = await User.insert(
        [
            {
                username: 'root',
                isActive: true,
                roles: ['reporter']
            }
        ],
        ['id']
    ).execute(client, []);
    if (!result.ok) {
        throw new Error(`Query failed with error ${result.error}`);
    }
    console.log(result.value); // { id: number }[]
};

pool.connect().then(async client => {
    await insertUser(client);
    client.release();
    await pool.end();
});
```

## UPDATE Operations

### UPDATE Parameter: `sets`

You can pass the `sets` object directly or use a generator function to access the context.

### UPDATE Parameter: `where`

See [SELECT Parameter: `where`](#select-parameter-where).

### UPDATE Parameter: `returning`

See [SELECT Parameter: `returning`](#select-parameter-returning).

### Example of UPDATE Operations

```typescript
import { pool } from './db';
import { User } from './User';
import { PoolClient } from 'pg';
import { U } from '@mrnafisia/type-query';

const updateUser = async (client: PoolClient) => {
    const result = await User.update(
        context => ({
            isActive: U.not(context.column('isActive')),
            isAdmin: false
        }),
        context => context.compare('roles', '?', 'reporter'),
        ['id']
    ).execute(client, []);
    if (!result.ok) {
        throw new Error(`Query failed with error ${result.error}`);
    }
    console.log(result.value); // { id: number }[]
};

pool.connect().then(async client => {
    await updateUser(client);
    client.release();
    await pool.end();
});
```

## DELETE Operations

### DELETE Parameter: `where`

See [SELECT Parameter: `where`](#select-parameter-where).

### DELETE Parameter: `returning`

See [SELECT Parameter: `returning`](#select-parameter-returning).

### Example of DELETE Operations

```typescript
import { pool } from './db';
import { User } from './User';
import { PoolClient } from 'pg';

const deleteUser = async (client: PoolClient) => {
    const result = await User.delete(
        context => context.compare('name', '=', 'john'),
        ['id']
    ).execute(client, []);
    if (!result.ok) {
        throw new Error(`Query failed with error ${result.error}`);
    }
    console.log(result.value); // { id: number }[]
};

pool.connect().then(async client => {
    await deleteUser(client);
    client.release();
    await pool.end();
});
```

## JOIN Operations

Using the `join` function alone will not result in a full query. The output is an object with `select` and `join`
functions, allowing you to join another table or perform a `select` on the joined tables.

### JOIN Parameter: `mainAlias`

This is the alias for the main table. It affects the returning column names and the context name whenever a context is
provided. A prefix of `${mainAlias}_` is added, so with `'u'` as the main alias, column names will be like `'u_id'`.

### JOIN Parameter: `joinType`

This specifies one of the four standard SQL join types.

```typescript
type JoinType = 'inner' | 'left' | 'right' | 'full';
```

### JOIN Parameter: `joinTable`

The table to join with.

### JOIN Parameter: `joinAlias`

This behaves like `mainAlias` and affects the `joinTable` in the same way.

### JOIN Parameter: `on`

`on` is a condition, similar to `where`, that determines which rows are included in the join. You can pass the `on`
condition directly or use a generator function to access the contexts. When a `join` function is called, the joining
table's context is added to the contexts object, prefixed with `${alias}Context`. For example, a main table with alias
`u` and a joined table with alias `p` will create `{ uContext, pContext }` instead of a single `context`.

### Example of JOIN Operations

```typescript
import { pool } from './db';
import { User } from './User';
import { PoolClient } from 'pg';
import { Product } from './Product';
import { U } from '@mrnafisia/type-query';

const joinSelect = async (client: PoolClient) => {
    const result = await User.join(
        'u',
        'inner',
        Product.table,
        'p',
        ({ uContext, pContext }) =>
            uContext.compare('id', '=', pContext.column('userID'))
    )
        .select(['u_id', 'p_title'], ({ uContext, pContext }) =>
            U.and(
                uContext.compare('name', 'like', 'john%'),
                pContext.columnsOr({
                    title: ['like some', ['table%', 'chair%']],
                    isDisabled: ['= false']
                })
            )
        )
        .execute(client, []);
    if (!result.ok) {
        throw new Error(`Query failed with error ${result.error}`);
    }
    console.log(result.value); // { u_id: number, p_title: string }[]
};

pool.connect().then(async client => {
    await joinSelect(client);
    client.release();
    await pool.end();
});
```

## Transaction Management

You can use `transaction` to create a database transaction. The transaction will be **committed** if you return an `ok`
result in the callback, and **rolled back** if you return an `err` result.  
**Hint:** Refer to [never-catch](https://github.com/MRNafisiA/never-catch) for details on `ok` and `err`.

### Transaction Parameter: `pool`

A created `pg` Pool instance.

### Transaction Parameter: `callback`

An asynchronous callback function that receives a connected `PoolClient` and returns a `Result`. The outcome of this
result determines whether the transaction is committed or rolled back.

### Transaction Parameter: `isolationLevel?`

Specifies one of the four standard SQL isolation levels. The default value is `serializable`.

```typescript
type TransactionIsolationLevel =
    | 'read-uncommitted'
    | 'read-committed'
    | 'repeatable-read'
    | 'serializable';
```

### Transaction Parameter: `readOnly?`

Indicates whether the transaction is read-only. The default value is `false`.

### Example of Transaction

```typescript
import { pool } from './db';
import { User } from './User';
import { ok } from 'never-catch';
import { transaction } from '@mrnafisia/type-query';

transaction(
    pool,
    async client => {
        const result = await User.insert(
            [{ username: 'admin', isActive: false, roles: ['writer'] }],
            ['id']
        ).execute(client, ['get', 1]);
        if (!result.ok) {
            return result; //           The transaction will be rolled back.
        }

        return ok(result.value.id); //  The transaction will be committed.
    },
    'read-committed',
    false
).then(async result => {
    console.log(result);
    await pool.end();
});
```

## Test Transaction Utility (for Unit and E2E Tests)

`testTransaction` is a utility for testing an action in isolation. It creates the necessary tables and sequences, fills
them with your provided initial data, performs the action, checks the tables against expected final data, and then
destroys everything in preparation for the next test.

### Test Transaction Parameter: `tablesWithData`

An array of tables with their initial and expected final data.

### Test Transaction Parameter: `callback`

An asynchronous callback function that receives a connected `PoolClient` with all your defined tables and data present.
Perform your action and assertions for the test here. At the end of the callback, the tables' data will be automatically
checked against the defined final data.

### Test Transaction Parameter: `pool`

See [Transaction Parameter: `pool`](#transaction-parameter-pool).  
`testTransaction` expects an empty database, as it creates and destroys everything itself.

### Test Transaction Parameter: `isolationLevel?`

See [Transaction Parameter: `isolationLevel?`](#transaction-parameter-isolationlevel).  
The default value in `testTransaction` is `'read-committed'`.

### Test Transaction Parameter: `rollback?`

Controls whether the transaction is rolled back after the test.  
The default value is `true`. Pass `false` when you need the data to remain for debugging purposes.

### Example of Test Transaction

**Hint:** Do not forget to put `.test.ts` at the end of the file name so the `test` and `expect` functions work.

```typescript
import { Pool } from 'pg';
import { User, type UserModel } from './User';
import { testTransaction, createTestTableData } from '@mrnafisia/type-query';

const testPool = new Pool({
    connectionString: 'postgres://postgres:12345678@localhost:5432/test'
});

afterAll(async () => {
    await testPool.end();
});

test('update user', () => {
    const user: UserModel = {
        id: 1,
        username: 'john',
        name: 'john doe',
        isActive: true,
        isAdmin: false,
        roles: []
    };

    return testTransaction(
        [
            createTestTableData(
                User.table,
                [user], // Nullable and default columns are optional
                [
                    {
                        ...user,
                        name: 'JOHN DOE', // A plain value to check directly
                        roles: (
                            //    Or a function that can check the value dynamically.
                            //    A boolean or Promise<boolean> for asynchronous checks (e.g., hash password verification).
                            cell,
                            rows,
                            index
                        ) => cell.length >= 3
                    }
                ]
            )
        ],
        async client => {
            const result = await User.update(
                { name: 'JOHN DOE', roles: ['reporter', 'writer', 'manager'] },
                context => context.compare('id', '=', 1),
                ['id', 'name', 'roles']
            ).execute(client, ['get', 1]);
            if (!result.ok) {
                throw new Error('Query failed.');
            }

            expect(result.value).toStrictEqual({
                id: 1,
                name: 'JOHN DOE',
                roles: ['reporter', 'writer', 'manager']
            });
        },
        testPool,
        'read-committed',
        true
    );
});
```

## Json Type

Type-Query only allows serializable values for JSON columns, as data must be stringified when entering the database and
parsed when it is fetched.

```typescript
type Json = JsonObject | JsonArray;

type JsonObject = {
    [key: number | string]: BaseJsonValue;
};
type JsonArray = BaseJsonValue[];

type BaseJsonValue =
    | undefined
    | null
    | boolean
    | number
    | string
    | JsonObject
    | JsonArray;
```
