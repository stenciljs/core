export class MockTokenList {
  constructor(
    private elm: HTMLElement,
    private attr: string,
  ) {}

  add(...tokens: string[]) {
    const items = getItems(this.elm, this.attr);
    let updated = false;
    tokens.forEach((token) => {
      token = String(token);
      validateToken(token);
      if (items.includes(token) === false) {
        items.push(token);
        updated = true;
      }
    });
    if (updated) {
      this.elm.setAttributeNS(null, this.attr, items.join(' '));
    }
  }

  remove(...tokens: string[]) {
    const items = getItems(this.elm, this.attr);
    let updated = false;
    tokens.forEach((token) => {
      token = String(token);
      validateToken(token);
      const index = items.indexOf(token);
      if (index > -1) {
        items.splice(index, 1);
        updated = true;
      }
    });
    if (updated) {
      this.elm.setAttributeNS(null, this.attr, items.filter((c) => c.length > 0).join(' '));
    }
  }

  contains(token: string) {
    token = String(token);
    return getItems(this.elm, this.attr).includes(token);
  }

  toggle(token: string) {
    token = String(token);
    if (this.contains(token) === true) {
      this.remove(token);
    } else {
      this.add(token);
    }
  }

  get length() {
    return getItems(this.elm, this.attr).length;
  }

  item(index: number) {
    return getItems(this.elm, this.attr)[index];
  }

  toString() {
    return getItems(this.elm, this.attr).join(' ');
  }
}

function validateToken(token: string) {
  if (token === '') {
    throw new Error('The token provided must not be empty.');
  }
  if (/\s/.test(token)) {
    throw new Error(`The token provided ('${token}') contains HTML space characters, which are not valid in tokens.`);
  }
}

function getItems(elm: HTMLElement, attr: string) {
  const value = elm.getAttribute(attr);
  if (typeof value === 'string' && value.length > 0) {
    return value
      .trim()
      .split(' ')
      .filter((c) => c.length > 0);
  }
  return [];
}
