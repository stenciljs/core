import { Component, State, h, Host, Listen } from '@stencil/core';
import _ from 'lodash';
import _es from 'lodash-es';
import videojs from 'video.js';
import { css } from 'linaria';
import { MeString } from './interfaces';

const linariaCss = css`
  background-color: rgba(0, 0, 255, 0.1);
`;

const styles = `
  #video {
    position: absolute;
    top: 400px;
    width: 80%;
    height: 300px;
    border: 2px solid blue;
    padding: 10px;
  }
`;

function format(target: any, propertyKey: string) {
  console.log(target, propertyKey);
}

@Component({
  tag: 'app-root',
  styles,
})
export class AppRoot {
  @format something = '12';
  @State() first: string;
  @State() last: MeString;
  @State() clothes: string;

  componentWillLoad() {
    const url = new URL(window.location.href);
    this.first = url.searchParams.get('first') || 'Stencil';
    this.last = url.searchParams.get('last') || 'JS';
    this.clothes = url.searchParams.get('clothes') || 'life preservers';
    console.log('lodash', _.camelCase('LODASH'));
    console.log('lodash-es', _es.camelCase('LODASH-ES'));
  }

  componentDidLoad() {
    videojs('video');
  }

  @Listen('scroll', { target: 'window' })
  scroll(ev: UIEvent) {
    console.log(ev.type);
  }

  render() {
    return (
      <Host>
        <prop-cmp first={this.first} lastName={this.last} clothes={this.clothes} mode="ios" />
        <div id="video" class={linariaCss}></div>
      </Host>
    );
  }
}
