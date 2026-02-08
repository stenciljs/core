export class MockHeaders {
  private _values: string[][] = [];

  constructor(init?: string[][] | Map<string, string> | any) {
    if (typeof init === 'object') {
      if (typeof init[Symbol.iterator] === 'function') {
        const kvs: string[][] = [];
        for (const kv of init) {
          if (typeof kv[Symbol.iterator] === 'function') {
            kvs.push([...kv]);
          }
        }
        for (const kv of kvs) {
          this.append(kv[0], kv[1]);
        }
      } else {
        for (const key in init) {
          this.append(key, init[key]);
        }
      }
    }
  }

  append(key: string, value: string) {
    this._values.push([key, value + '']);
  }

  delete(key: string) {
    key = key.toLowerCase();
    for (let i = this._values.length - 1; i >= 0; i--) {
      if (this._values[i][0].toLowerCase() === key) {
        this._values.splice(i, 1);
      }
    }
  }

  entries(): any {
    const entries: string[][] = [];
    for (const kv of this.keys()) {
      entries.push([kv, this.get(kv)]);
    }
    let index = -1;
    return {
      next() {
        index++;
        return {
          value: entries[index],
          done: !entries[index],
        };
      },
      [Symbol.iterator]() {
        return this;
      },
    };
  }

  forEach(cb: (value: string, key: string) => void) {
    for (const kv of this.entries()) {
      cb(kv[1], kv[0]);
    }
  }

  get(key: string) {
    const rtn: string[] = [];
    key = key.toLowerCase();
    for (const kv of this._values) {
      if (kv[0].toLowerCase() === key) {
        rtn.push(kv[1]);
      }
    }
    return rtn.length > 0 ? rtn.join(', ') : null;
  }

  has(key: string) {
    key = key.toLowerCase();
    for (const kv of this._values) {
      if (kv[0].toLowerCase() === key) {
        return true;
      }
    }
    return false;
  }

  keys() {
    const keys: string[] = [];
    for (const kv of this._values) {
      const key = kv[0].toLowerCase();
      if (!keys.includes(key)) {
        keys.push(key);
      }
    }
    let index = -1;
    return {
      next() {
        index++;
        return {
          value: keys[index],
          done: !keys[index],
        };
      },
      [Symbol.iterator]() {
        return this;
      },
    };
  }

  set(key: string, value: string) {
    for (const kv of this._values) {
      if (kv[0].toLowerCase() === key.toLowerCase()) {
        kv[1] = value + '';
        return;
      }
    }
    this.append(key, value);
  }

  values(): any {
    const values = this._values;
    let index = -1;
    return {
      next() {
        index++;
        const done = !values[index];
        return {
          value: done ? undefined : values[index][1],
          done,
        };
      },
      [Symbol.iterator]() {
        return this;
      },
    };
  }

  [Symbol.iterator]() {
    return this.entries();
  }
}
