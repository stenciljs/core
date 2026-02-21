import { Component, h } from '@stencil/core';

/**
 * rendering this component will fail as `<attribute-basic /`> is compiled with
 * a `dist-custom-element` output target, which will break in a lazy load environment
 */
@Component({
  tag: 'global-script-dist-cmp',
  scoped: true,
})
export class GlobalScriptDistCmp {
  render() {
    return (
      <section>
        <attribute-basic></attribute-basic>
      </section>
    );
  }
}
