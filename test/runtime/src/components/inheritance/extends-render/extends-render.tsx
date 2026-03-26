import { Component, h, State } from '@stencil/core';
import { RenderBase } from './render-base.js';

@Component({
  tag: 'extends-render',
})
export class ExtendsRender extends RenderBase {
  @State() componentTitle: string = 'Extended Component';
  @State() additionalContent: string = 'Additional component content';

  componentWillLoad() {
    this.baseTitle = 'Extended Base Title';
    this.baseClass = 'base-container extended';
  }

  render() {
    return (
      <div class='component-wrapper'>
        <div class='component-header'>
          <h2 class='component-title'>{this.componentTitle}</h2>
        </div>

        {super.render()}

        <div class='component-additional'>
          <p class='additional-content'>{this.additionalContent}</p>
        </div>
      </div>
    );
  }
}
