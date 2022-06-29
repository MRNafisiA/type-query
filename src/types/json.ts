type JSON = JsonObject | JsonArray;
type JsonObject = { [key: string]: BaseJsonValue };
type JsonArray = BaseJsonValue[];
type BaseJsonValue = JsonObject
    | JsonArray
    | string
    | number
    | boolean
    | null;

export type {
    JSON,
    JsonObject,
    JsonArray,
    BaseJsonValue
};