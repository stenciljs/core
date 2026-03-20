import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'app-root',
  styleUrl: 'app-root.css',
})
export class AppRoot {
  render() {
    return (
      <Host>
        <cmp-a>
          <cmp-d uniqueId="a1-child" />
          <cmp-d uniqueId="a2-child" />
          <cmp-d uniqueId="a3-child" />
          <cmp-d uniqueId="a4-child" />
        </cmp-a>
        <div class="server">
          <div id="server-componentWillLoad" />
          <div id="server-componentDidLoad" />
        </div>
        <div class="client">
          <div id="client-componentWillLoad" />
          <div id="client-componentDidLoad" />
        </div>
        <div>
          <cmp-scoped-a></cmp-scoped-a>
        </div>
        <div>
          <cmp-scoped-b></cmp-scoped-b>
        </div>
      </Host>
    );
  }
}
