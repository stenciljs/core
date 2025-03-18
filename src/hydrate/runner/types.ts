export type ScriptLocalValue =
  | ScriptPrimitiveProtocolValue
  | ScriptArrayLocalValue
  | ScriptDateLocalValue
  | ScriptSymbolValue
  | ScriptMapLocalValue
  | ScriptObjectLocalValue
  | ScriptRegExpLocalValue
  | ScriptSetLocalValue;
export type ScriptListLocalValue = ScriptLocalValue[];

export interface ScriptArrayLocalValue {
  type: 'array';
  value: ScriptListLocalValue;
}

export interface ScriptDateLocalValue {
  type: 'date';
  value: string;
}

export type ScriptMappingLocalValue = (ScriptLocalValue | ScriptLocalValue)[];

export interface ScriptMapLocalValue {
  type: 'map';
  value: ScriptMappingLocalValue;
}

export interface ScriptObjectLocalValue {
  type: 'object';
  value: ScriptMappingLocalValue;
}

export interface ScriptRegExpValue {
  pattern: string;
  flags?: string;
}

export interface ScriptRegExpLocalValue {
  type: 'regexp';
  value: ScriptRegExpValue;
}

export interface ScriptSetLocalValue {
  type: 'set';
  value: ScriptListLocalValue;
}

export type ScriptPreloadScript = string;
export type ScriptRealm = string;
export type ScriptPrimitiveProtocolValue =
  | ScriptUndefinedValue
  | ScriptNullValue
  | ScriptStringValue
  | ScriptNumberValue
  | ScriptBooleanValue
  | ScriptBigIntValue;

export interface ScriptUndefinedValue {
  type: 'undefined';
}

export interface ScriptNullValue {
  type: 'null';
}

export interface ScriptStringValue {
  type: 'string';
  value: string;
}

export interface ScriptSymbolValue {
  type: 'symbol';
  value: string;
}

export type ScriptSpecialNumber = 'NaN' | '-0' | 'Infinity' | '-Infinity';

export interface ScriptNumberValue {
  type: 'number';
  value: number | ScriptSpecialNumber;
}

export interface ScriptBooleanValue {
  type: 'boolean';
  value: boolean;
}

export interface ScriptBigIntValue {
  type: 'bigint';
  value: string;
}
