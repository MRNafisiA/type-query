# type-query

SQL Query Builder written in TypeScript

# Introduction
Type-Query is a lightweight, schema-aware mini ORM for PostgreSQL, built with TypeScript.
Its main goal is to provide strong type-safety while still giving developers full control over their SQL queries.

Traditional ORMs often abstract away the details of SQL. They make common tasks simple and provide type-safety, but at the cost of flexibility. On the other hand, query builders give developers complete control over queries, but they can be verbose, difficult to type, and harder to maintain.

Type-Query sits right in the middle:

- ✅ Type-safety without losing query control
- ✅ A schema-aware system that prevents runtime mistakes
- ✅ A clean developer experience with full SQL flexibility

With Type-Query, you get the best of both worlds: the safety and developer productivity of an ORM, combined with the precision and control of a query builder.

# Getting Started

## Installation

```shell
npm i @mrnafisia/type-query
```

## Example

### 1. Connect
Type-Query works directly with a [pg](https://node-postgres.com) Pool instance.

`db.ts`
```typescript
import { Pool } from 'pg';

const pool = new Pool({ connectionString: 'postgres://postgres:12345678@localhost:5432/hermes_2025_04_23' });
```

### 2. Define a Entity
To define Entities in Type-Query, you first define a schema and a table, then combine them into an entity.

Entities are type-safe representations of your database tables.

`UserSchema.ts`
```typescript
// 1. Define the schema (TypeScript-level types)
type UserSchema = {
    id: {
        type: number;
        nullable: false;
        default: true;
    };
    username: {
        type: string;
        nullable: false;
        default: false;
    };
    password: {
        type: string;
        nullable: false;
        default: false;
    };
    isAdmin: {
        type: boolean;
        nullable: false;
        default: false;
    };
};

// 2. Define the table (PostgreSQL-level structure)
const UserTable: Table<UserSchema> = {
    schemaName: 'general',
    tableName: 'user',
    columns: {
        id: {
            type: 'int4',
            nullable: false,
            default: true,
            primary: true,
            defaultValue: ['auto-increment']
        },
        username: {
            type: 'varchar',
            nullable: false,
            default: false,
            minLength: 1,
            maxLength: 24,
            regex: /^[\w-]*$/
        },
        password: {
            type: 'varchar',
            nullable: false,
            default: false
        },
        isAdmin: {
            type: 'boolean',
            nullable: false,
            default: false
        }
    }
};

// 3. Create the entity (ready for queries)
const User = createEntity(UserTable);
```