/**
 * Intermediate representation of a single CSS-only component definition, parsed from one
 * `@component`-marked JSDoc block and the rules that share its tag name within the same file.
 * Produced by `parse-css-component.ts`, consumed by `css-component-meta.ts` to build a full
 * `ComponentCompilerMeta`.
 */
export interface CssOnlyComponentDef {
  tagName: string;
  sourceFilePath: string;
  /** Free-text description from the `@component` JSDoc block, before the first `@tag`. */
  docsText: string;
  /** Any `@tag text` lines in the block that aren't `@component`/`@prop`/`@cssprop`/`@attr`. */
  docsTags: CssOnlyJsDocTag[];
  /** Custom properties, from explicit `@prop`/`@cssprop`, auto-detected `--x` declarations, and `@property` at-rules. */
  properties: CssOnlyPropertyDoc[];
  /** Attributes, from explicit `@attr` annotations and auto-detected attribute-selector literals. */
  attributes: CssOnlyAttributeDoc[];
}

export interface CssOnlyJsDocTag {
  name: string;
  text: string;
}

export interface CssOnlyPropertyDoc {
  /** The custom property name, e.g. `--badge-color`. */
  name: string;
  docs: string;
  source: 'explicit' | 'auto' | 'property-rule';
  /** From a native `@property` at-rule's `syntax` descriptor. */
  syntax?: string;
  /** From a native `@property` at-rule's `initial-value` descriptor. */
  default?: string;
}

export interface CssOnlyAttributeDoc {
  name: string;
  /** A TS type string - a primitive (`boolean`/`string`/`number`) or a literal union. */
  type: string;
  docs: string;
  source: 'explicit' | 'auto';
}
