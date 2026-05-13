import { Component } from '@stencil/core';

@Component({
  tag: 'css-url-paths',
  styleUrl: 'css-url-paths.css',
})
export class CssUrlPaths {
  render() {
    return [<div id='relative'></div>, <div id='relativeToRoot'></div>, <div id='absolute'></div>];
  }
}
