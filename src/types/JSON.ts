type JsonValue = JsonObject | JsonArray;
type JsonObject = { [key: string]: BaseJsonValue };
type JsonArray = BaseJsonValue[];
type BaseJsonValue = string
    | number
    | bigint
    | boolean
    | Date
    | JsonObject
    | JsonArray
    | null;

export {JsonValue, JsonObject, JsonArray, BaseJsonValue};