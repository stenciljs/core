export class MockHistory {
  private items: any[] = [];

  get length() {
    return this.items.length;
  }

  back() {
    this.go(-1);
  }

  forward() {
    this.go(1);
  }

  go(_value: number) {
    //
  }

  pushState(_state: any, _title: string, _url: string) {
    //
  }

  replaceState(_state: any, _title: string, _url: string) {
    //
  }
}
