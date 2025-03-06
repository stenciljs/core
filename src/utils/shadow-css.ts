/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 *
 * This file is a port of shadowCSS from `webcomponents.js` to TypeScript.
 * https://github.com/webcomponents/webcomponentsjs/blob/4efecd7e0e/src/ShadowCSS/ShadowCSS.js
 * https://github.com/angular/angular/blob/master/packages/compiler/src/shadow_css.ts
 */

import { escapeRegExpSpecialCharacters } from './regular-expression';

const safeSelector = (selector: string) => {
  const placeholders: string[] = [];
  let index = 0;

  // Replaces attribute selectors with placeholders.
  // The WS in [attr="va lue"] would otherwise be interpreted as a selector separator.
  selector = selector.replace(/(\[[^\]]*\])/g, (_, keep) => {
    const replaceBy = `__ph-${index}__`;
    placeholders.push(keep);
    index++;
    return replaceBy;
  });

  // Replaces the expression in `:nth-child(2n + 1)` with a placeholder.
  // WS and "+" would otherwise be interpreted as selector separators.
  const content = selector.replace(/(:nth-[-\w]+)(\([^)]+\))/g, (_, pseudo, exp) => {
    const replaceBy = `__ph-${index}__`;
    placeholders.push(exp);
    index++;
    return pseudo + replaceBy;
  });

  const ss: SafeSelector = {
    content,
    placeholders,
  };
  return ss;
};

const restoreSafeSelector = (placeholders: string[], content: string) => {
  return content.replace(/__ph-(\d+)__/g, (_, index) => placeholders[+index]);
};

interface SafeSelector {
  content: string;
  placeholders: string[];
}

interface CssRule {
  selector: string;
  content: string;
}

interface StringWithEscapedBlocks {
  escapedString: string;
  blocks: string[];
}

const _polyfillHost = '-shadowcsshost';
const _polyfillSlotted = '-shadowcssslotted';
// note: :host-context pre-processed to -shadowcsshostcontext.
const _polyfillHostContext = '-shadowcsscontext';
const _parenSuffix = ')(?:\\((' + '(?:\\([^)(]*\\)|[^)(]*)+?' + ')\\))?([^,{]*)';
const _cssColonHostRe = new RegExp('(' + _polyfillHost + _parenSuffix, 'gim');
const _cssColonHostContextRe = new RegExp('(' + _polyfillHostContext + _parenSuffix, 'gim');
const _cssColonSlottedRe = new RegExp('(' + _polyfillSlotted + _parenSuffix, 'gim');
const _polyfillHostNoCombinator = _polyfillHost + '-no-combinator';
const _polyfillHostNoCombinatorRe = /-shadowcsshost-no-combinator([^\s]*)/;
const _shadowDOMSelectorsRe = [/::shadow/g, /::content/g];

const _selectorReSuffix = '([>\\s~+[.,{:][\\s\\S]*)?$';
const _polyfillHostRe = /-shadowcsshost/gim;

/**
 * Little helper for generating a regex that will match a specified
 * CSS selector when that selector is _not_ a part of a `@supports` rule.
 *
 * The pattern will match the provided `selector` (i.e. ':host', ':host-context', etc.)
 * when that selector is not a part of a `@supports` selector rule _or_ if the selector
 * is a part of the rule's declaration.
 *
 * For instance, if we create the regex with the selector ':host-context':
 * - '@supports selector(:host-context())' will return no matches (starts with '@supports')
 * - '@supports selector(:host-context()) { :host-context() { ... }}' will match the second ':host-context' (part of declaration)
 * - ':host-context() { ... }' will match ':host-context' (selector is not a '@supports' rule)
 * - ':host() { ... }' will return no matches (selector doesn't match selector used to create regex)
 *
 * @param selector The CSS selector we want to match for replacement
 * @returns A look-behind regex containing the selector
 */
const createSupportsRuleRe = (selector: string) =>
  new RegExp(`((?<!(^@supports(.*)))|(?<=\{.*))(${selector}\\b)`, 'gim');
const _colonSlottedRe = createSupportsRuleRe('::slotted');
const _colonHostRe = createSupportsRuleRe(':host');
const _colonHostContextRe = createSupportsRuleRe(':host-context');

const _commentRe = /\/\*\s*[\s\S]*?\*\//g;

const stripComments = (input: string) => {
  return input.replace(_commentRe, '');
};

const _commentWithHashRe = /\/\*\s*#\s*source(Mapping)?URL=[\s\S]+?\*\//g;

const extractCommentsWithHash = (input: string): string[] => {
  return input.match(_commentWithHashRe) || [];
};

const _ruleRe = /(\s*)([^;\{\}]+?)(\s*)((?:{%BLOCK%}?\s*;?)|(?:\s*;))/g;
const _curlyRe = /([{}])/g;
const _selectorPartsRe = /(^.*?[^\\])??((:+)(.*)|$)/;
const OPEN_CURLY = '{';
const CLOSE_CURLY = '}';
const BLOCK_PLACEHOLDER = '%BLOCK%';

const processRules = (input: string, ruleCallback: (rule: CssRule) => CssRule): string => {
  const inputWithEscapedBlocks = escapeBlocks(input);
  let nextBlockIndex = 0;
  return inputWithEscapedBlocks.escapedString.replace(_ruleRe, (...m: string[]) => {
    const selector = m[2];
    let content = '';
    let suffix = m[4];
    let contentPrefix = '';
    if (suffix && suffix.startsWith('{' + BLOCK_PLACEHOLDER)) {
      content = inputWithEscapedBlocks.blocks[nextBlockIndex++];
      suffix = suffix.substring(BLOCK_PLACEHOLDER.length + 1);
      contentPrefix = '{';
    }
    const cssRule: CssRule = {
      selector,
      content,
    };
    const rule = ruleCallback(cssRule);
    return `${m[1]}${rule.selector}${m[3]}${contentPrefix}${rule.content}${suffix}`;
  });
};

const escapeBlocks = (input: string) => {
  const inputParts = input.split(_curlyRe);
  const resultParts: string[] = [];
  const escapedBlocks: string[] = [];
  let bracketCount = 0;
  let currentBlockParts: string[] = [];
  for (let partIndex = 0; partIndex < inputParts.length; partIndex++) {
    const part = inputParts[partIndex];
    if (part === CLOSE_CURLY) {
      bracketCount--;
    }
    if (bracketCount > 0) {
      currentBlockParts.push(part);
    } else {
      if (currentBlockParts.length > 0) {
        escapedBlocks.push(currentBlockParts.join(''));
        resultParts.push(BLOCK_PLACEHOLDER);
        currentBlockParts = [];
      }
      resultParts.push(part);
    }
    if (part === OPEN_CURLY) {
      bracketCount++;
    }
  }
  if (currentBlockParts.length > 0) {
    escapedBlocks.push(currentBlockParts.join(''));
    resultParts.push(BLOCK_PLACEHOLDER);
  }
  const strEscapedBlocks: StringWithEscapedBlocks = {
    escapedString: resultParts.join(''),
    blocks: escapedBlocks,
  };
  return strEscapedBlocks;
};

/**
 * Replaces certain strings within the CSS with placeholders
 * that will later be replaced with class selectors appropriate
 * for the level of encapsulation (shadow or scoped).
 *
 * When performing these replacements, we want to ignore selectors that are a
 * part of an `@supports` rule. Replacing these selectors will result in invalid
 * CSS that gets passed to autoprefixer/postcss once the placeholders are replaced.
 * For example, a rule like:
 *
 * ```css
 * @supports selector(:host()) {
 *   :host {
 *     color: red;
 *   }
 * }
 * ```
 *
 * Should be converted to:
 *
 * ```css
 * @supports selector(:host()) {
 *   -shadowcsshost {
 *     color: red;
 *   }
 * }
 * ```
 *
 * The order the regex replacements happen in matters since we match
 * against a whole selector word so we need to match all of `:host-context`
 * before we try to replace `:host`. Otherwise the pattern for `:host` would match
 * `:host-context` resulting in something like `:-shadowcsshost-context`.
 *
 * @param cssText A CSS string for a component
 * @returns The modified CSS string
 */
const insertPolyfillHostInCssText = (cssText: string) => {
  // These replacements use a special syntax with the `$1`. When the replacement
  // occurs, `$1` maps to the content of the string leading up to the selector
  // to be replaced.
  //
  // Otherwise, we will replace all the preceding content in addition to the
  // selector because of the lookbehind in the regex.
  //
  // e.g. `/*!@___0___*/:host {}` => `/*!@___0___*/--shadowcsshost {}`
  cssText = cssText
    .replace(_colonHostContextRe, `$1${_polyfillHostContext}`)
    .replace(_colonHostRe, `$1${_polyfillHost}`)
    .replace(_colonSlottedRe, `$1${_polyfillSlotted}`);

  return cssText;
};

const convertColonRule = (cssText: string, regExp: RegExp, partReplacer: Function) => {
  // m[1] = :host(-context), m[2] = contents of (), m[3] rest of rule
  return cssText.replace(regExp, (...m: string[]) => {
    if (m[2]) {
      const parts = m[2].split(',');
      const r: string[] = [];
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i].trim();
        if (!p) break;
        r.push(partReplacer(_polyfillHostNoCombinator, p, m[3]));
      }
      return r.join(',');
    } else {
      return _polyfillHostNoCombinator + m[3];
    }
  });
};

const colonHostPartReplacer = (host: string, part: string, suffix: string) => {
  return host + part.replace(_polyfillHost, '') + suffix;
};

const convertColonHost = (cssText: string) => {
  return convertColonRule(cssText, _cssColonHostRe, colonHostPartReplacer);
};

const colonHostContextPartReplacer = (host: string, part: string, suffix: string) => {
  if (part.indexOf(_polyfillHost) > -1) {
    return colonHostPartReplacer(host, part, suffix);
  } else {
    return host + part + suffix + ', ' + part + ' ' + host + suffix;
  }
};

const convertColonSlotted = (cssText: string, slotScopeId: string) => {
  const slotClass = '.' + slotScopeId + ' > ';
  const selectors: { orgSelector: string; updatedSelector: string }[] = [];

  cssText = cssText.replace(_cssColonSlottedRe, (...m: string[]) => {
    if (m[2]) {
      const compound = m[2].trim();
      const suffix = m[3];
      const slottedSelector = slotClass + compound + suffix;

      let prefixSelector = '';
      for (let i: number = (m[4] as any) - 1; i >= 0; i--) {
        const char = m[5][i];
        if (char === '}' || char === ',') {
          break;
        }
        prefixSelector = char + prefixSelector;
      }

      const orgSelector = (prefixSelector + slottedSelector).trim();
      const addedSelector = `${prefixSelector.trimEnd()}${slottedSelector.trim()}`.trim();
      if (orgSelector !== addedSelector) {
        const updatedSelector = `${addedSelector}, ${orgSelector}`;
        selectors.push({
          orgSelector,
          updatedSelector,
        });
      }

      return slottedSelector;
    } else {
      return _polyfillHostNoCombinator + m[3];
    }
  });

  return {
    selectors,
    cssText,
  };
};

const convertColonHostContext = (cssText: string) => {
  return convertColonRule(cssText, _cssColonHostContextRe, colonHostContextPartReplacer);
};

const convertShadowDOMSelectors = (cssText: string) => {
  return _shadowDOMSelectorsRe.reduce((result, pattern) => result.replace(pattern, ' '), cssText);
};

const makeScopeMatcher = (scopeSelector: string) => {
  const lre = /\[/g;
  const rre = /\]/g;
  scopeSelector = scopeSelector.replace(lre, '\\[').replace(rre, '\\]');
  return new RegExp('^(' + scopeSelector + ')' + _selectorReSuffix, 'm');
};

const selectorNeedsScoping = (selector: string, scopeSelector: string) => {
  const re = makeScopeMatcher(scopeSelector);
  return !re.test(selector);
};

const injectScopingSelector = (selector: string, scopingSelector: string) => {
  return selector.replace(_selectorPartsRe, (_: string, before = '', _colonGroup: string, colon = '', after = '') => {
    return before + scopingSelector + colon + after;
  });
};

const applySimpleSelectorScope = (selector: string, scopeSelector: string, hostSelector: string) => {
  // In Android browser, the lastIndex is not reset when the regex is used in String.replace()
  _polyfillHostRe.lastIndex = 0;
  if (_polyfillHostRe.test(selector)) {
    const replaceBy = `.${hostSelector}`;
    return selector
      .replace(_polyfillHostNoCombinatorRe, (_, selector) => injectScopingSelector(selector, replaceBy))
      .replace(_polyfillHostRe, replaceBy + ' ');
  }

  return scopeSelector + ' ' + selector;
};

const applyStrictSelectorScope = (selector: string, scopeSelector: string, hostSelector: string) => {
  const isRe = /\[is=([^\]]*)\]/g;
  scopeSelector = scopeSelector.replace(isRe, (_: string, ...parts: string[]) => parts[0]);

  const className = '.' + scopeSelector;

  const _scopeSelectorPart = (p: string) => {
    let scopedP = p.trim();

    if (!scopedP) {
      return '';
    }

    if (p.indexOf(_polyfillHostNoCombinator) > -1) {
      scopedP = applySimpleSelectorScope(p, scopeSelector, hostSelector);
    } else {
      // remove :host since it should be unnecessary
      const t = p.replace(_polyfillHostRe, '');
      if (t.length > 0) {
        scopedP = injectScopingSelector(t, className);
      }
    }

    return scopedP;
  };

  const safeContent = safeSelector(selector);
  selector = safeContent.content;

  let scopedSelector = '';
  let startIndex = 0;
  let res: RegExpExecArray | null;
  const sep = /( |>|\+|~(?!=))\s*/g;

  // If a selector appears before :host it should not be shimmed as it
  // matches on ancestor elements and not on elements in the host's shadow
  // `:host-context(div)` is transformed to
  // `-shadowcsshost-no-combinatordiv, div -shadowcsshost-no-combinator`
  // the `div` is not part of the component in the 2nd selectors and should not be scoped.
  // Historically `component-tag:host` was matching the component so we also want to preserve
  // this behavior to avoid breaking legacy apps (it should not match).
  // The behavior should be:
  // - `tag:host` -> `tag[h]` (this is to avoid breaking legacy apps, should not match anything)
  // - `tag :host` -> `tag [h]` (`tag` is not scoped because it's considered part of a
  //   `:host-context(tag)`)
  const hasHost = selector.indexOf(_polyfillHostNoCombinator) > -1;
  // Only scope parts after the first `-shadowcsshost-no-combinator` when it is present
  let shouldScope = !hasHost;

  while ((res = sep.exec(selector)) !== null) {
    const separator = res[1];
    const part = selector.slice(startIndex, res.index).trim();
    shouldScope = shouldScope || part.indexOf(_polyfillHostNoCombinator) > -1;
    const scopedPart = shouldScope ? _scopeSelectorPart(part) : part;
    scopedSelector += `${scopedPart} ${separator} `;
    startIndex = sep.lastIndex;
  }

  const part = selector.substring(startIndex);
  shouldScope = shouldScope || part.indexOf(_polyfillHostNoCombinator) > -1;
  scopedSelector += shouldScope ? _scopeSelectorPart(part) : part;

  // replace the placeholders with their original values
  return restoreSafeSelector(safeContent.placeholders, scopedSelector);
};

const scopeSelector = (selector: string, scopeSelectorText: string, hostSelector: string, slotSelector: string) => {
  return selector
    .split(',')
    .map((shallowPart) => {
      if (slotSelector && shallowPart.indexOf('.' + slotSelector) > -1) {
        return shallowPart.trim();
      }

      if (selectorNeedsScoping(shallowPart, scopeSelectorText)) {
        return applyStrictSelectorScope(shallowPart, scopeSelectorText, hostSelector).trim();
      } else {
        return shallowPart.trim();
      }
    })
    .join(', ');
};

const scopeSelectors = (
  cssText: string,
  scopeSelectorText: string,
  hostSelector: string,
  slotSelector: string,
  commentOriginalSelector: boolean,
) => {
  return processRules(cssText, (rule: CssRule) => {
    let selector = rule.selector;
    let content = rule.content;
    if (rule.selector[0] !== '@') {
      selector = scopeSelector(rule.selector, scopeSelectorText, hostSelector, slotSelector);
    } else if (
      rule.selector.startsWith('@media') ||
      rule.selector.startsWith('@supports') ||
      rule.selector.startsWith('@page') ||
      rule.selector.startsWith('@document')
    ) {
      content = scopeSelectors(rule.content, scopeSelectorText, hostSelector, slotSelector, commentOriginalSelector);
    }

    const cssRule: CssRule = {
      selector: selector.replace(/\s{2,}/g, ' ').trim(),
      content,
    };
    return cssRule;
  });
};

const scopeCssText = (
  cssText: string,
  scopeId: string,
  hostScopeId: string,
  slotScopeId: string,
  commentOriginalSelector: boolean,
) => {
  cssText = insertPolyfillHostInCssText(cssText);
  cssText = convertColonHost(cssText);
  cssText = convertColonHostContext(cssText);

  const slotted = convertColonSlotted(cssText, slotScopeId);
  cssText = slotted.cssText;
  cssText = convertShadowDOMSelectors(cssText);

  if (scopeId) {
    cssText = scopeSelectors(cssText, scopeId, hostScopeId, slotScopeId, commentOriginalSelector);
  }

  cssText = replaceShadowCssHost(cssText, hostScopeId);
  cssText = cssText.replace(/>\s*\*\s+([^{, ]+)/gm, ' $1 ');

  return {
    cssText: cssText.trim(),
    // We need to replace the shadow CSS host string in each of these selectors since we created
    // them prior to the replacement happening in the components CSS text.
    slottedSelectors: slotted.selectors.map((ref) => ({
      orgSelector: replaceShadowCssHost(ref.orgSelector, hostScopeId),
      updatedSelector: replaceShadowCssHost(ref.updatedSelector, hostScopeId),
    })),
  };
};

/**
 * Helper function that replaces the interim string representing a `:host` selector with
 * the host scope selector class for the element.
 *
 * @param cssText The CSS string to make the replacement in
 * @param hostScopeId The scope ID that will be used as the class representing the host element
 * @returns CSS with the selector replaced
 */
const replaceShadowCssHost = (cssText: string, hostScopeId: string) => {
  return cssText.replace(/-shadowcsshost-no-combinator/g, `.${hostScopeId}`);
};

export const scopeCss = (cssText: string, scopeId: string, commentOriginalSelector: boolean) => {
  const hostScopeId = scopeId + '-h';
  const slotScopeId = scopeId + '-s';

  const commentsWithHash = extractCommentsWithHash(cssText);

  cssText = stripComments(cssText);
  const orgSelectors: {
    placeholder: string;
    comment: string;
  }[] = [];

  if (commentOriginalSelector) {
    const processCommentedSelector = (rule: CssRule) => {
      const placeholder = `/*!@___${orgSelectors.length}___*/`;
      const comment = `/*!@${rule.selector}*/`;

      orgSelectors.push({ placeholder, comment });
      rule.selector = placeholder + rule.selector;
      return rule;
    };

    cssText = processRules(cssText, (rule) => {
      if (rule.selector[0] !== '@') {
        return processCommentedSelector(rule);
      } else if (
        rule.selector.startsWith('@media') ||
        rule.selector.startsWith('@supports') ||
        rule.selector.startsWith('@page') ||
        rule.selector.startsWith('@document')
      ) {
        rule.content = processRules(rule.content, processCommentedSelector);
        return rule;
      }
      return rule;
    });
  }

  const scoped = scopeCssText(cssText, scopeId, hostScopeId, slotScopeId, commentOriginalSelector);
  cssText = [scoped.cssText, ...commentsWithHash].join('\n');

  if (commentOriginalSelector) {
    orgSelectors.forEach(({ placeholder, comment }) => {
      cssText = cssText.replace(placeholder, comment);
    });
  }

  scoped.slottedSelectors.forEach((slottedSelector) => {
    const regex = new RegExp(escapeRegExpSpecialCharacters(slottedSelector.orgSelector), 'g');
    cssText = cssText.replace(regex, slottedSelector.updatedSelector);
  });

  return cssText;
};
