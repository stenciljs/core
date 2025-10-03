import { MockStyleElement } from './element';

class MockCSSRule {
  cssText = '';
  type = 0;
  constructor(public parentStyleSheet: MockCSSStyleSheet) {}
}

export class MockCSSStyleSheet {
  ownerNode?: MockStyleElement;
  type = 'text/css';
  parentStyleSheet: MockCSSStyleSheet = null;
  cssRules: MockCSSRule[] = [];

  constructor(ownerNode?: MockStyleElement) {
    this.ownerNode = ownerNode;
  }

  get rules() {
    return this.cssRules;
  }
  set rules(rules) {
    this.cssRules = rules;
  }

  deleteRule(index: number) {
    if (index >= 0 && index < this.cssRules.length) {
      this.cssRules.splice(index, 1);
      if (this.ownerNode) {
        updateStyleTextNode(this.ownerNode);
      }
    }
  }

  insertRule(rule: string, index = 0) {
    if (typeof index !== 'number') {
      index = 0;
    }
    if (index < 0) {
      index = 0;
    }
    if (index > this.cssRules.length) {
      index = this.cssRules.length;
    }
    const cssRule = new MockCSSRule(this);
    cssRule.cssText = rule;
    this.cssRules.splice(index, 0, cssRule);
    if (this.ownerNode) {
      updateStyleTextNode(this.ownerNode);
    }
    return index;
  }

  replaceSync(cssText: string) {
    // Clear current rules
    this.cssRules = [];

    // Naive rule parser: split by `}` and restore closing bracket
    const rules = cssText
      .split('}')
      .map((rule) => rule.trim())
      .filter(Boolean)
      .map((rule) => rule + '}');

    for (const rule of rules) {
      const cssRule = new MockCSSRule(this);
      cssRule.cssText = rule;
      this.cssRules.push(cssRule);
    }

    if (this.ownerNode) {
      updateStyleTextNode(this.ownerNode);
    }
  }
}

export function getStyleElementText(styleElm: MockStyleElement) {
  const output: string[] = [];
  for (let i = 0; i < styleElm.childNodes.length; i++) {
    output.push(styleElm.childNodes[i].nodeValue);
  }
  return output.join('');
}

export function setStyleElementText(styleElm: MockStyleElement, text: string) {
  // keeping the innerHTML and the sheet.cssRules connected
  // is not technically correct, but since we're doing
  // SSR we'll need to turn any assigned cssRules into
  // real text, not just properties that aren't rendered
  const sheet = styleElm.sheet;
  sheet.cssRules.length = 0;
  sheet.insertRule(text);

  updateStyleTextNode(styleElm);
}

function updateStyleTextNode(styleElm: MockStyleElement) {
  const childNodeLen = styleElm.childNodes.length;
  if (childNodeLen > 1) {
    for (let i = childNodeLen - 1; i >= 1; i--) {
      styleElm.removeChild(styleElm.childNodes[i]);
    }
  } else if (childNodeLen < 1) {
    styleElm.appendChild(styleElm.ownerDocument.createTextNode(''));
  }
  const textNode = styleElm.childNodes[0];
  textNode.nodeValue = styleElm.sheet.cssRules.map((r) => r.cssText).join('\n');
}
