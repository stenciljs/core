<p align="center">
  <a href="#">
    <img alt="stencil-logo" src="https://github.com/stenciljs/core/blob/main/stencil-logo.png" width="60">
  </a>
</p>

<h1 align="center">
  Stencil
</h1>

<p align="center">
  A compiler for generating <a href="https://www.webcomponents.org/introduction" target="_blank" rel="noopener noref">Web Components</a> using technologies like TypeScript and JSX, built by the <a href="https://ionic.io/">Ionic team</a>.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@stencil/core">
    <img src="https://img.shields.io/npm/v/@stencil/core.svg" alt="StencilJS is released under the MIT license." /></a>
  <a href="https://github.com/stenciljs/core/blob/main/LICENSE.md">
    <img src="https://img.shields.io/badge/license-MIT-yellow.svg" alt="StencilJS is released under the MIT license." />
  </a>
  <a href="https://github.com/stenciljs/core/blob/main/CONTRIBUTING.md">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome!" />
  </a>
  <a href="https://twitter.com/stenciljs">
    <img src="https://img.shields.io/badge/follow-%40stenciljs-1DA1F2?logo=twitter" alt="Follow @stenciljs">
  </a>
  <a href="https://chat.stenciljs.com">
    <img src="https://img.shields.io/discord/520266681499779082?color=7289DA&label=%23stencil&logo=discord&logoColor=white" alt="Official Ionic Discord" />
  </a>
</p>

<h2 align="center">
  <a href="https://stenciljs.com/docs/getting-started#starting-a-new-project">Quick Start</a>
  <span> · </span>
  <a href="https://stenciljs.com/docs/introduction">Documentation</a>
  <span> · </span>
  <a href="https://github.com/stenciljs/core/blob/main/CONTRIBUTING.md">Contribute</a>
  <span> · </span>
  <a href="https://ionicframework.com/blog/tag/stencil/">Blog</a>
  <br />
  Community:
  <a href="https://chat.stenciljs.com">Discord</a>
  <span> · </span>
  <a href="https://forum.ionicframework.com/c/stencil/21/">Forums</a>
  <span> · </span>
  <a href="https://twitter.com/stenciljs">Twitter</a>
</h2>

### Getting Started

Start a new project by following our quick [Getting Started guide](https://stenciljs.com/docs/getting-started).
We would love to hear from you!
If you have any feedback or run into issues using Stencil, please file an [issue](https://github.com/stenciljs/core/issues/new) on this repository.

### Examples
A Stencil component looks a lot like a class-based React component, with the addition of TypeScript decorators:
```tsx
import { Component, Prop, h } from '@stencil/core';

@Component({
  tag: 'my-component',            // the name of the component's custom HTML tag
  styleUrl: 'my-component.css',   // css styles to apply to the component
  shadow: true,                   // this component uses the ShadowDOM
})
export class MyComponent {
  // The component accepts two arguments:
  @Prop() first: string;
  @Prop() last: string;

   //The following HTML is rendered when our component is used
  render() {
    return (
      <div>
        Hello, my name is {this.first} {this.last}
      </div>
    );
  }
}
```

The component above can be used like any other HTML element:

```html
<my-component first="Stencil" last="JS"></my-component>
```

Since Stencil generates web components, they work in any major framework or with no framework at all.
In many cases, Stencil can be used as a drop in replacement for traditional frontend framework, though using it as such is certainly not required.

### Contributing

Thanks for your interest in contributing!
Please take a moment to read up on our guidelines for [contributing](https://github.com/stenciljs/core/blob/main/CONTRIBUTING.md). We've created comprehensive technical documentation for contributors that explains Stencil's internal architecture, including the compiler, runtime, build system, and other core components in the [/docs](/docs/) directory.
Please note that this project is released with a [Contributor Code of Conduct](https://github.com/stenciljs/core/blob/main/CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.