export class MockStorage {
  private items = new Map<string, string>();

  key(_value: number) {
    //
  }

  getItem(key: string) {
    key = String(key);

    if (this.items.has(key)) {
      return this.items.get(key);
    }
    return null;
  }

  setItem(key: string, value: string) {
    if (value == null) {
      value = 'null';
    }
    this.items.set(String(key), String(value));
  }

  removeItem(key: string) {
    this.items.delete(String(key));
  }

  clear() {
    this.items.clear();
  }
}
