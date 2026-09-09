export class MockCSSStyleDeclaration {
  private _styles = new Map<string, string>();

  setProperty(prop: string, value: string) {
    prop = jsCaseToCssCase(prop);

    if (value == null || value === '') {
      this._styles.delete(prop);
    } else {
      this._styles.set(prop, String(value));
    }
  }

  getPropertyValue(prop: string) {
    prop = jsCaseToCssCase(prop);
    return String(this._styles.get(prop) || '');
  }

  removeProperty(prop: string) {
    prop = jsCaseToCssCase(prop);
    this._styles.delete(prop);
  }

  get length() {
    return this._styles.size;
  }

  get cssText() {
    const cssText: string[] = [];

    this._styles.forEach((value, prop) => {
      cssText.push(`${prop}: ${value};`);
    });

    return cssText.join(' ').trim();
  }

  set cssText(cssText: string) {
    if (cssText == null || cssText === '') {
      this._styles.clear();
      return;
    }

    cssText.split(';').forEach((rule) => {
      rule = rule.trim();
      if (rule.length > 0) {
        const splt = rule.split(':');
        if (splt.length > 1) {
          const prop = splt[0].trim();
          const value = splt.slice(1).join(':').trim();
          if (prop !== '' && value !== '') {
            this._styles.set(jsCaseToCssCase(prop), value);
          }
        }
      }
    });
  }
}

export function createCSSStyleDeclaration() {
  return new Proxy(new MockCSSStyleDeclaration(), cssProxyHandler);
}

const cssProxyHandler: ProxyHandler<MockCSSStyleDeclaration> = {
  get(cssStyle, prop: string) {
    if (prop in cssStyle) {
      return (cssStyle as any)[prop];
    }
    prop = cssCaseToJsCase(prop);
    return cssStyle.getPropertyValue(prop);
  },

  set(cssStyle, prop: string, value) {
    if (prop in cssStyle) {
      (cssStyle as any)[prop] = value;
    } else {
      cssStyle.setProperty(prop, value);
    }
    return true;
  },
};

function cssCaseToJsCase(str: string) {
  // font-size to fontSize
  if (str.length > 1 && str.includes('-') === true) {
    str = str
      .toLowerCase()
      .split('-')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join('');
    str = str.slice(0, 1).toLowerCase() + str.slice(1);
  }
  return str;
}

function jsCaseToCssCase(str: string) {
  // fontSize to font-size
  if (str.length > 1 && str.includes('-') === false && /[A-Z]/.test(str) === true) {
    str = str
      .replace(/([A-Z])/g, (g) => ' ' + g[0])
      .trim()
      .replace(/ /g, '-')
      .toLowerCase();
  }

  return str;
}
