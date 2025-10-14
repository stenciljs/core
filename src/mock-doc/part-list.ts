export class MockPartList {
  constructor(private elm: HTMLElement) {}

  add(...partNames: string[]) {
    const partNames_ = getItems(this.elm);
    let updated = false;
    partNames.forEach((partName) => {
      partName = String(partName);
      validatePart(partName);
      if (partNames_.includes(partName) === false) {
        partNames_.push(partName);
        updated = true;
      }
    });
    if (updated) {
      this.elm.setAttributeNS(null, 'part', partNames_.join(' '));
    }
  }

  remove(...partNames: string[]) {
    const partNames_ = getItems(this.elm);
    let updated = false;
    partNames.forEach((partName) => {
      partName = String(partName);
      validatePart(partName);
      const index = partNames_.indexOf(partName);
      if (index > -1) {
        partNames_.splice(index, 1);
        updated = true;
      }
    });
    if (updated) {
      this.elm.setAttributeNS(null, 'part', partNames_.filter((p) => p.length > 0).join(' '));
    }
  }

  contains(partName: string) {
    partName = String(partName);
    return getItems(this.elm).includes(partName);
  }

  toggle(partName: string) {
    partName = String(partName);
    if (this.contains(partName) === true) {
      this.remove(partName);
    } else {
      this.add(partName);
    }
  }

  get length() {
    return getItems(this.elm).length;
  }

  item(index: number) {
    return getItems(this.elm)[index];
  }

  toString() {
    return getItems(this.elm).join(' ');
  }
}

function validatePart(partName: string) {
  if (partName === '') {
    throw new Error('The token provided must not be empty.');
  }
  if (/\s/.test(partName)) {
    throw new Error(
      `The token provided ('${partName}') contains HTML space characters, which are not valid in tokens.`,
    );
  }
}

function getItems(elm: HTMLElement) {
  const partName = elm.getAttribute('part');
  if (typeof partName === 'string' && partName.length > 0) {
    return partName
      .trim()
      .split(' ')
      .filter((p) => p.length > 0);
  }
  return [];
}