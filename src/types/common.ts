export type Id = string;

export type IsoDateString = string;

export type LtpPeriod = string;

export type JsonPrimitive = string | number | boolean | null;

export type JsonArray = readonly JsonValue[];

export interface JsonObject {
  readonly [key: string]: JsonValue;
}

export type JsonValue = JsonPrimitive | JsonArray | JsonObject;

export type FormFieldValue = JsonValue;
