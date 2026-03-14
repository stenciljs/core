import { Component, h, State } from '@stencil/core';

@Component({
  tag: 'slot-light-dom-root',
})
export class SlotLightDomRoot {
  @State() a = 'a';
  @State() b = 'b';
  @State() c = 'c';
  @State() d = 'd';
  @State() e = 'e';
  @State() f = 'f';
  @State() g = 'g';
  @State() h = 'h';
  @State() i = 'i';
  @State() j = 'j';
  @State() k = 'k';
  @State() l = 'l';
  @State() m = 'm';

  testClick() {
    this.a = 'A';
    this.b = 'B';
    this.c = 'C';
    this.d = 'D';
    this.e = 'E';
    this.f = 'F';
    this.g = 'G';
    this.h = 'H';
    this.i = 'I';
    this.j = 'J';
    this.k = 'K';
    this.l = 'L';
    this.m = 'M';
  }

  render() {
    return (
      <div>
        <button onClick={this.testClick.bind(this)}>Test</button>

        <slot-light-dom-content class="results1">{this.a}</slot-light-dom-content>

        <slot-light-dom-content class="results2">{this.b}</slot-light-dom-content>

        <slot-light-dom-content class="results3">
          <nav>{this.c}</nav>
        </slot-light-dom-content>

        <slot-light-dom-content class="results4">
          <nav>{this.d}</nav>
          {this.e}
        </slot-light-dom-content>

        <slot-light-dom-content class="results5">
          {this.f}
          <nav>{this.g}</nav>
        </slot-light-dom-content>

        <slot-light-dom-content class="results6">
          {this.h}
          <nav>{this.i}</nav>
          {this.j}
        </slot-light-dom-content>

        <slot-light-dom-content class="results7">
          <nav>{this.k}</nav>
          <nav>{this.l}</nav>
          <nav>{this.m}</nav>
        </slot-light-dom-content>
      </div>
    );
  }
}
