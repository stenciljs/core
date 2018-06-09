import { parse } from './css-parser';
import { CSSScope } from './interfaces';
import { getSelectors, getSelectorsForScopes, resolveValues } from './selectors';
import { compileTemplate, executeTemplate } from './template';
import { getChildScopeAttribute, getHostScopeAttribute, getSlotScopeAttribute } from '../../../util/scope';

export function parseCSS(original: string, compile = true): CSSScope {
  const ast = parse(original);
  const template = (compile) ? compileTemplate(original) : [original];
  const selectors = getSelectors(ast);
  return {
    original,
    template,
    selectors,
    isDynamic: template.length > 1
  };
}

export function getScopesForElement(hostTemplateMap: WeakMap<HTMLElement, CSSScope>, node: HTMLElement) {
  const scopes: CSSScope[] = [];
  while (node) {
    const scope = hostTemplateMap.get(node);
    if (scope) {
      scopes.push(scope);
    }
    node = node.parentElement;
  }
  return scopes;
}

export function addGlobalStyle(globalScopes: CSSScope[], styleEl: HTMLStyleElement) {
  const css = parseCSS(styleEl.innerHTML, true);
  css.styleEl = styleEl;
  globalScopes.push(css);
}

export function updateGlobalScopes(scopes: CSSScope[]) {
  const selectors = getSelectorsForScopes(scopes);
  const props = resolveValues(selectors);
  scopes.forEach(scope => {
    if (scope.isDynamic) {
      scope.styleEl.innerHTML = executeTemplate(scope.template, props);
    }
  });
}

export function reScope(scope: CSSScope, cssScopeId: string): CSSScope {

  const template = scope.template.map(segment => {
    return (typeof segment === 'string')
      ? replaceScope(segment, scope.cssScopeId, cssScopeId)
      : segment;
  });

  return {
    ...scope,
    template,
    cssScopeId,
  };
}

export function replaceScope(original: string, oldScopeId: string, newScopeId: string) {
  return original
    .replace(`[${getHostScopeAttribute(oldScopeId)}]`, `[${getHostScopeAttribute(newScopeId)}]`)
    .replace(`[${getChildScopeAttribute(oldScopeId)}]`, `[${getChildScopeAttribute(newScopeId)}]`)
    .replace(`[${getSlotScopeAttribute(oldScopeId)}]`, `[${getSlotScopeAttribute(newScopeId)}]`);
}
