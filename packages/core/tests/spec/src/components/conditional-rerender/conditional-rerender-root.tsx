import { Component, h, State } from '@stencil/core';

@Component({
  tag: 'conditional-rerender-root',
})
export class ConditionalRerenderRoot {
  @State() showContent = false;
  @State() showFooter = false;

  componentDidLoad() {
    this.showFooter = true;
    setTimeout(() => (this.showContent = true), 20);
  }

  render() {
    return (
      <conditional-rerender>
        <header>Header</header>
        {this.showContent ? <section>Content</section> : null}
        {this.showFooter ? <footer>Footer</footer> : null}
      </conditional-rerender>
    );
  }
}
