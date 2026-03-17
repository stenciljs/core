import { Component, h, Listen, State } from '@stencil/core';

@Component({
  tag: 'listen-window',
})
export class ListenWindow {
  @State() clicked = 0;
  @State() scrolled = 0;

  @Listen('click', { target: 'window' })
  winClick() {
    this.clicked++;
  }

  @Listen('scroll', { target: 'window' })
  winScroll() {
    this.scrolled++;
  }

  render() {
    return (
      <div>
        <div id="clicked">Clicked: {this.clicked}</div>
        <div>Scrolled: {this.scrolled}</div>
        <button>Click!</button>
        <div style={{ background: 'gray', paddingTop: '2000px' }}></div>
      </div>
    );
  }
}
