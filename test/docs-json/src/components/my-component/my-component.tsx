import { Component, h, Method } from '@stencil/core';

import { ImportedInterface, importedInterface } from './imported-interface';

@Component({
  tag: 'my-component',
  styleUrls: {
    ios: './my-component.ios.css',
    md: './my-component.md.css',
  },
  shadow: true,
})
export class MyComponent {
  /**
   * A comment, which should be included, I should think!
   */
  @Method()
  onDidDismiss<T>(arg: T): Promise<ImportedInterface<T>> {
    return importedInterface(arg);
  }

  render() {
    return <div>Hello, World! I'm a mess 🫠</div>;
  }
}
