import postcss from 'postcss';
import nesting from 'postcss-nesting';
import selectorParser from 'postcss-selector-parser';
import type * as d from '@stencil/core';

import { buildError, buildWarn, validateComponentTag } from '../../utils';
import { createCssOnlyComponentMeta } from './css-component-meta';
import type {
  CssOnlyAttributeDoc,
  CssOnlyComponentDef,
  CssOnlyJsDocTag,
  CssOnlyPropertyDoc,
} from './types';

/**
 * Parse a single `.css` file's text for CSS-only components and build full
 * `ComponentCompilerMeta` for each one found. 
 *
 * @param filePath absolute path to the `.css` file, used only for diagnostics
 * @param cssText the file's raw CSS text
 * @returns discovered component metas, plus diagnostics for malformed input
 */
export const parseCssOnlyComponents = async (
  filePath: string,
  cssText: string,
): Promise<{ components: d.ComponentCompilerMeta[]; diagnostics: d.Diagnostic[] }> => {
  const { defs, diagnostics } = await parseCssComponentFile(filePath, cssText);
  return { components: defs.map(createCssOnlyComponentMeta), diagnostics };
};

/**
 * Parse a single `.css` file's text for CSS-only component definitions - rules whose selector
 * is a valid custom-element tag name, marked with an explicit `@component` JSDoc tag.
 *
 * @param filePath absolute path to the `.css` file, used only for diagnostics
 * @param cssText the file's raw CSS text
 * @returns any discovered component definitions, plus diagnostics for malformed input
 */
export const parseCssComponentFile = async (
  filePath: string,
  cssText: string,
): Promise<{ defs: CssOnlyComponentDef[]; diagnostics: d.Diagnostic[] }> => {
  const diagnostics: d.Diagnostic[] = [];

  // Cheap guard - avoid paying the postcss/nesting-resolution cost for the vast majority of
  // .css files in a project that have nothing to do with this feature.
  if (!cssText.includes('@component')) {
    return { defs: [], diagnostics };
  }

  let root: postcss.Root;
  try {
    const result = await postcss([nesting()]).process(cssText, { from: filePath });
    root = result.root;
  } catch (e: any) {
    const err = buildError(diagnostics);
    err.messageText = `Unable to parse CSS for CSS-only components: ${e?.message ?? e}`;
    err.absFilePath = filePath;
    return { defs: [], diagnostics };
  }

  const defs = new Map<string, CssOnlyComponentDef>();
  const nodes = root.nodes;

  // Pass 1: find @component-marked top-level rules and establish one CssOnlyComponentDef per tag.
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type !== 'comment' || !isJsDocComment(node.text)) {
      continue;
    }

    const block = parseJsDocBlock(node.text);
    if (!block.tags.some((t) => t.name === 'component')) {
      continue;
    }

    const next = nodes[i + 1];
    if (!next || next.type !== 'rule') {
      // @component comment not immediately followed by a rule - ambiguous, not a clear
      // mistake, so no diagnostic.
      continue;
    }

    const selectors = parseSelectorList(next.selector);
    if (selectors.length !== 1) {
      const warn = buildWarn(diagnostics);
      warn.messageText = `Found "@component" JSDoc above a rule with a multi-selector list ("${next.selector}") - a CSS-only component's defining rule must be a single tag selector.`;
      warn.absFilePath = filePath;
      continue;
    }

    const baseTag = selectors[0].tag;
    const tagError = baseTag ? validateComponentTag(baseTag) : 'no tag name found in selector';
    if (!baseTag || tagError || selectors[0].nonTagParts.length > 0) {
      const warn = buildWarn(diagnostics);
      warn.messageText = `Found "@component" JSDoc above a rule ("${next.selector}") that is not a valid custom-element tag selector${tagError ? `: ${tagError}` : ''}.`;
      warn.absFilePath = filePath;
      continue;
    }

    if (defs.has(baseTag)) {
      const warn = buildWarn(diagnostics);
      warn.messageText = `Duplicate "@component" definition for tag "${baseTag}" in the same file - the first definition wins.`;
      warn.absFilePath = filePath;
      continue;
    }

    const { docsText, docsTags, properties, attributes } = buildDefFromJsDocBlock(block);
    defs.set(baseTag, {
      tagName: baseTag,
      sourceFilePath: filePath,
      docsText,
      docsTags,
      properties,
      attributes,
    });
  }

  if (defs.size === 0) {
    return { defs: [], diagnostics };
  }

  // Pass 2: for every top-level rule (including ones hoisted flat by postcss-nesting) whose
  // base tag matches an established def, collect auto-detected attribute variants and
  // auto-detected documented custom properties.
  for (const node of nodes) {
    if (node.type !== 'rule') {
      continue;
    }
    for (const selector of parseSelectorList(node.selector)) {
      const def = defs.get(selector.tag ?? '');
      if (!def) {
        continue;
      }
      collectAutoDetectedAttributes(selector, def);
    }
  }

  for (const node of nodes) {
    if (node.type !== 'rule') {
      continue;
    }
    const matchingTag = parseSelectorList(node.selector).find((s) => defs.has(s.tag ?? ''))?.tag;
    const def = matchingTag ? defs.get(matchingTag) : undefined;
    if (def) {
      collectAutoDetectedCustomProperties(node, def);
    }
  }

  // Pass 3: @property at-rules are global, not tag-scoped - apply to every def in the file.
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type !== 'atrule' || node.name !== 'property') {
      continue;
    }
    const propName = node.params.trim();
    if (!propName.startsWith('--')) {
      continue;
    }

    let syntax: string | undefined;
    let initialValue: string | undefined;
    node.each((child) => {
      if (child.type !== 'decl') {
        return;
      }
      if (child.prop === 'syntax') {
        syntax = stripQuotes(child.value);
      } else if (child.prop === 'initial-value') {
        initialValue = child.value;
      }
    });

    const prev = nodes[i - 1];
    const docs =
      prev && prev.type === 'comment' && isJsDocComment(prev.text)
        ? normalizeJsDocText(prev.text)
        : '';

    for (const def of defs.values()) {
      if (def.properties.some((p) => p.name === propName)) {
        continue; // explicit @prop/@cssprop annotation already wins
      }
      const prop: CssOnlyPropertyDoc = {
        name: propName,
        docs,
        source: 'property-rule',
        ...(syntax && { syntax }),
        ...(initialValue && { default: initialValue }),
      };
      def.properties.push(prop);
    }
  }

  return { defs: Array.from(defs.values()), diagnostics };
};

interface ParsedSelector {
  tag: string | null;
  attributes: { name: string; value?: string }[];
  /** Any selector parts beyond the leading tag (classes, pseudo, ids, combinators). */
  nonTagParts: string[];
}

/**
 * Parse a (possibly comma-separated) selector list into one entry per selector, each with the
 * leading tag name and the attribute selectors that belong to that *same leading compound*
 * selector (i.e. before any combinator) - `my-badge[variant]` collects `variant`, but
 * `my-badge [data-x]` (a descendant combinator) does not, since `data-x` belongs to a
 * different element entirely.
 * @param selectorText the raw, possibly comma-separated selector text
 * @returns one parsed entry per comma-separated selector
 */
const parseSelectorList = (selectorText: string): ParsedSelector[] => {
  const results: ParsedSelector[] = [];
  const ast = selectorParser().astSync(selectorText);
  ast.each((selector) => {
    const parsed: ParsedSelector = { tag: null, attributes: [], nonTagParts: [] };
    let inLeadingCompound = true;
    selector.each((n) => {
      if (n.type === 'combinator') {
        inLeadingCompound = false;
        parsed.nonTagParts.push(n.type);
        return;
      }
      if (n.type === 'tag' && parsed.tag === null && inLeadingCompound) {
        parsed.tag = n.value;
        return;
      }
      if (n.type === 'attribute' && inLeadingCompound) {
        parsed.attributes.push({ name: n.attribute, value: n.value ?? undefined });
        return;
      }
      parsed.nonTagParts.push(n.type);
    });
    results.push(parsed);
  });
  return results;
};

const collectAutoDetectedAttributes = (selector: ParsedSelector, def: CssOnlyComponentDef) => {
  for (const attr of selector.attributes) {
    if (def.attributes.some((a) => a.name === attr.name && a.source === 'explicit')) {
      continue; // explicit @attr annotation already wins
    }
    const existing = def.attributes.find((a) => a.name === attr.name && a.source === 'auto');
    if (existing) {
      if (attr.value !== undefined && !existing.type.includes(JSON.stringify(attr.value))) {
        existing.type = mergeLiteralUnion(existing.type, attr.value);
      }
      continue;
    }
    def.attributes.push({
      name: attr.name,
      type: attr.value !== undefined ? literalUnionType([attr.value]) : 'boolean',
      docs: '',
      source: 'auto',
    });
  }
};

const mergeLiteralUnion = (existingType: string, value: string): string => {
  const literal = JSON.stringify(value);
  const escapeHatch = ' | (string & {})';
  const base = existingType.endsWith(escapeHatch)
    ? existingType.slice(0, -escapeHatch.length)
    : existingType;
  return `${base} | ${literal}${escapeHatch}`;
};

const literalUnionType = (values: string[]): string =>
  `${values.map((v) => JSON.stringify(v)).join(' | ')} | (string & {})`;

const collectAutoDetectedCustomProperties = (rule: postcss.Rule, def: CssOnlyComponentDef) => {
  const children = rule.nodes;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.type !== 'decl' || !child.prop.startsWith('--')) {
      continue;
    }
    if (def.properties.some((p) => p.name === child.prop)) {
      continue; // explicit @prop/@cssprop annotation already wins
    }
    const prev = children[i - 1];
    if (!prev || prev.type !== 'comment' || !isJsDocComment(prev.text)) {
      continue; // undocumented custom property - not collected
    }
    def.properties.push({
      name: child.prop,
      docs: normalizeJsDocText(prev.text),
      source: 'auto',
    });
  }
};

const stripQuotes = (value: string): string => value.replace(/^['"]|['"]$/g, '');

/**
 * A JSDoc-style comment is `/** ... *\/` or `/*! ... *\/` - postcss's `Comment.text` already
 * strips the `/*`/`*\/` delimiters, so this checks the leading `*` or `!` that remains.
 * @param commentText a postcss `Comment` node's `.text`
 * @returns `true` if the comment is JSDoc-style
 */
const isJsDocComment = (commentText: string): boolean =>
  commentText.startsWith('*') || commentText.startsWith('!');

/**
 * Strip the leading `*`/`!` marker and per-line `*` prefixes, returning trimmed lines.
 * @param commentText a postcss `Comment` node's `.text`
 * @returns the comment's lines, delimiters and leading `*`s stripped
 */
const normalizeJsDocLines = (commentText: string): string[] => {
  const withoutMarker = commentText.replace(/^[*!]/, '');
  return withoutMarker
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^\*/, '').trim())
    .filter((line, i, arr) => !(line === '' && (i === 0 || i === arr.length - 1)));
};

const normalizeJsDocText = (commentText: string): string =>
  normalizeJsDocLines(commentText).filter(Boolean).join(' ').trim();

interface JsDocBlock {
  description: string;
  tags: { name: string; text: string }[];
}

/**
 * Parse a JSDoc comment's inner text into a leading free-text description and a series of
 * `@tag text` entries, where a tag's text may continue across subsequent non-`@`-leading lines.
 * @param commentText a postcss `Comment` node's `.text`
 * @returns the parsed description and tag entries
 */
const parseJsDocBlock = (commentText: string): JsDocBlock => {
  const lines = normalizeJsDocLines(commentText);
  const descriptionLines: string[] = [];
  const tags: { name: string; text: string }[] = [];

  let current: { name: string; text: string } | null = null;
  for (const line of lines) {
    const tagMatch = line.match(/^@(\S+)\s*(.*)$/);
    if (tagMatch) {
      if (current) {
        tags.push(current);
      }
      current = { name: tagMatch[1], text: tagMatch[2].trim() };
    } else if (current) {
      current.text = current.text ? `${current.text} ${line}`.trim() : line;
    } else if (line) {
      descriptionLines.push(line);
    }
  }
  if (current) {
    tags.push(current);
  }

  return { description: descriptionLines.join(' ').trim(), tags };
};

const ATTR_TAG_RE = /^\{([^}]*)\}\s*([\w-]+)(?:\s*-\s*(.*))?$/;
const PROP_TAG_NAMES = new Set(['prop', 'cssprop']);
const RESERVED_TAG_NAMES = new Set(['component', 'prop', 'cssprop', 'attr']);

const buildDefFromJsDocBlock = (
  block: JsDocBlock,
): Pick<CssOnlyComponentDef, 'docsText' | 'docsTags' | 'properties' | 'attributes'> => {
  const docsTags: CssOnlyJsDocTag[] = [];
  const properties: CssOnlyPropertyDoc[] = [];
  const attributes: CssOnlyAttributeDoc[] = [];
  const descriptionParts = [block.description];

  for (const tag of block.tags) {
    if (tag.name === 'component') {
      // `@component` may appear before the free-text description (the convention used
      // throughout this feature's own docs), so its own trailing text is part of the
      // description too, not a discarded tag body.
      if (tag.text) {
        descriptionParts.push(tag.text);
      }
      continue;
    }
    if (PROP_TAG_NAMES.has(tag.name)) {
      const colonIndex = tag.text.indexOf(':');
      const name = (colonIndex === -1 ? tag.text : tag.text.slice(0, colonIndex)).trim();
      const docs = colonIndex === -1 ? '' : tag.text.slice(colonIndex + 1).trim();
      if (name.startsWith('--')) {
        properties.push({ name, docs, source: 'explicit' });
      }
      continue;
    }
    if (tag.name === 'attr') {
      const match = tag.text.match(ATTR_TAG_RE);
      if (match) {
        const [, type, name, docs] = match;
        attributes.push({ name, type: type.trim(), docs: (docs ?? '').trim(), source: 'explicit' });
      }
      continue;
    }
    if (!RESERVED_TAG_NAMES.has(tag.name)) {
      docsTags.push({ name: tag.name, text: tag.text });
    }
  }

  return {
    docsText: descriptionParts.filter(Boolean).join(' ').trim(),
    docsTags,
    properties,
    attributes,
  };
};
