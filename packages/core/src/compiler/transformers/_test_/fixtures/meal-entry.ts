// =================
// RE-EXPORT TESTING
// =================
//
// This section includes types designed to test that the type library
// functionality correctly 'follows' exports back to their home module
// (in this case `./dessert`)

// re-export w/ alias and `export type`, should be under original name in
// `docs.json`
export type { IceCream as Glace } from './dessert';
// re-export w/ alias, should be under original name in `docs.json`
export { Cake as Gateau } from './dessert';
// re-export w/ `export type`
export type { Pie } from './dessert';
// re-export
export { Cookie } from './dessert';
// 'export *' to catch one interface that isn't re-exported by name
export * from './dessert';

// ==============
// EXPORTED TYPES
// ==============
//
// This section includes types for testing that types declared in and
// exported from this file are correctly included.

/**
 * This has some documentation!
 */
export enum BestEnum {
  Best,
  Worst,
  JustAlright,
}

export type StringUnion = 'left' | 'right';

export type JustAnAlias = string;

/**
 * This is a private type, and should not be included!
 *
 * @private
 */
export type PrivateType = {
  not: 'public';
};
