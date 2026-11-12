import { AttrDeserialize, Build, Component, Prop, PropSerialize, h } from '@stencil/core';

/**
 * A prop JSON can't carry (a `Map`): `ssrProp()` hands it to the server render as it is, and the
 * component's own `@PropSerialize` / `@AttrDeserialize` carry it to the browser.
 */
@Component({
  tag: 'ssr-prop-map-cmp',
  encapsulation: { type: 'shadow' },
})
export class SsrPropMapCmp {
  @Prop() scores: Map<string, number> = new Map();

  @PropSerialize('scores')
  serializeScores(value: Map<string, number>) {
    return Build.isBrowser ? null : JSON.stringify([...value]);
  }

  @AttrDeserialize('scores')
  deserializeScores(value: string) {
    return new Map(JSON.parse(value));
  }

  componentWillLoad() {
    if (Build.isBrowser) {
      (window as any).__firstScores = this.scores instanceof Map ? [...this.scores] : 'not a Map';
    }
  }

  render() {
    return (
      <ul>
        {[...this.scores].map(([name, score]) => (
          <li>
            {name}: {score}
          </li>
        ))}
      </ul>
    );
  }
}
