import { Component, h } from '@stencil/core';

import styles from './prerender-cmp.css';

@Component({
  tag: 'prerender-cmp',
  styles,
  shadow: true,
})
export class PrerenderCmp {
  render() {
    return [
      <div>a</div>,
      <div>b</div>,
      <div>
        <div>c</div>
        <div>
          {[
            <div>d</div>,
            <div>
              {[
                <div>e</div>,
                <div>f</div>,
                <div>g</div>,
                <div>h</div>,
                <div>i</div>,
                <div>j</div>,
                <div>k</div>,
                <div>l</div>,
              ]}
            </div>,
          ]}
        </div>
      </div>,
      <a href="/some-link">Some Link</a>,
    ];
  }
}
