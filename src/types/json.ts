import Decimal from 'decimal.js';

type JSON = JsonObject | JsonArray;
type JsonObject = { [key: string]: BaseJsonValue };
type JsonArray = BaseJsonValue[];
type BaseJsonValue = null
    | boolean
    | number
    | bigint
    | Decimal
    | string
    | Date
    | JsonObject
    | JsonArray;

export type {
    JSON,
    JsonObject,
    JsonArray,
    BaseJsonValue
};