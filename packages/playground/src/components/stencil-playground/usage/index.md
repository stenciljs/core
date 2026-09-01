## Basic Usage

```html
<stencil-playground></stencil-playground>
<script>
  const playground = document.querySelector('stencil-playground');
  playground.files=[
    {
      "name": "bloob.tsx",
      "content": `
import { Component } from '@stencil/core';

@Component({ 
  tag: 'my-component',
  styles: \`
    div { color: red; }
  \` 
})
export class MyComponent {
  render() { 
    return <div>Hello, World!</div>;
  }
}
      `
    }
  ];
</script>
```

## Stencil config

```html
<stencil-playground class="playground-2"></stencil-playground>
<script>
  const playground2 = document.querySelector('.playground-2');
  playground2.files=[
    {
      "name": "blab.tsx",
      "content": `
import { Component, State } from '@stencil/core';
import { computed, Effect } from '@stencil/core/signals';

@Component({ tag: 'my-stats' })
export class MyStats {
  @State() count = 0;

  doubled = computed(() => this.count * 2);

  @Effect()
  logChange() {
    console.log('count is now', this.count);
  }

  render() {
    return <div>{this.count} x 2 = {this.doubled}</div>;
  }
}
      `
    },
    {
      "name": "stencil.config.ts",
      "content": `
export const config = {
  signalBacking: true,
};
      `
    }
  ];
</script>
```

## Mixins

```html
<stencil-playground class="playground-3"></stencil-playground>
<script>
  const playground3 = document.querySelector('.playground-3');
  playground3.files=[
    {
      "name": "countable.ts",
      "content": `
import { State } from '@stencil/core';

export const Countable = (Base) => {
  class CountableClass extends Base {
    @State() count = 0;

    increment() {
      this.count++;
    }
  }
  return CountableClass;
};
      `
    },
    {
      "name": "my-counter.tsx",
      "content": `
import { Component, Mixin } from '@stencil/core';
import { Countable } from './countable';

@Component({ tag: 'my-counter' })
export class MyCounter extends Mixin(Countable) {
  render() {
    return <button onClick={() => this.increment()}>Count: {this.count}</button>;
  }
}
      `
    }
  ];
</script>
```

```html
<stencil-playground class="playground-4"></stencil-playground>
<script>
  const playground4 = document.querySelector('.playground-4');
  playground4.files=[
    {
      "name": "cmp-style.css",
      "content": `
:host {
  display: block;
  background-color: lightgray;
}
      `
    },
    {
      "name": "my-cmp.tsx",
      "content": `
import { Component, Mixin } from '@stencil/core';

@Component({ 
  tag: 'my-cmp', 
  encapsulation: {type: 'scoped'},
  styleUrl: './cmp-style.css'
})
export class MyCmp {
  render() {
    return <div>yay</div>;
  }
}
      `
    }
  ];
</script>
```