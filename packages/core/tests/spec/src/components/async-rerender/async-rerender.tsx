import { Component, h, Host, State } from '@stencil/core';

@Component({
  tag: 'async-rerender',
  scoped: true,
})
export class MyComponent {
  @State() data: any[];

  @State() isLoaded = false;

  componentWillLoad() {
    this.fetchData();
  }

  private asyncThing(): Promise<{ name: string }[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = Array.from({ length: 20 }, (_, i) => ({ name: `name ${i + 1}` }));

        const getRandomItems = (arr: any, num: number) => {
          const shuffled = arr.sort(() => 0.5 - Math.random());
          return shuffled.slice(0, num);
        };

        resolve(getRandomItems(data, 10));
      }, 500);
    });
  }

  async fetchData() {
    this.data = await this.asyncThing();
    this.isLoaded = true;
  }

  async prev() {
    this.isLoaded = false;
    this.data = (await this.asyncThing()).slice(0, 5);
    this.isLoaded = true;
  }

  async after() {
    this.isLoaded = false;
    this.data = await this.asyncThing();
    this.isLoaded = true;
  }

  display() {
    return this.data !== undefined && this.data !== null;
  }

  render() {
    return (
      <Host>
        <p>
          <button onClick={() => this.prev()}>Previous</button>
          <button onClick={() => this.after()}>Next</button>
        </p>
        {this.display() && (
          <section class={`data-state ${this.isLoaded ? 'loaded' : ''}`}>
            {this.data?.map((d) => <div class="number">{d.name}</div>)}
          </section>
        )}
      </Host>
    );
  }
}
