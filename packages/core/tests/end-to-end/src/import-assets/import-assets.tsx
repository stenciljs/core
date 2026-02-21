import { Component, Host, h } from '@stencil/core';
import myText from './assets/my-text.txt';
import whateverHtml from './assets/whatever.html?format=text';
import ionicSvgUrl from './assets/ionic.svg';
import ionicSvgText from './assets/ionic.svg?format=text';

@Component({
  tag: 'import-assets',
})
export class AppRoot {
  render() {
    return (
      <Host>
        <div id="txt">{myText}</div>
        <div id="whatever-html">{whateverHtml}</div>
        <img id="ionic-svg-url" src={ionicSvgUrl} />
        <div id="ionic-svg-text">{ionicSvgText}</div>
      </Host>
    );
  }
}
