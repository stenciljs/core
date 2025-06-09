import { Component, h, State } from '@stencil/core';

@Component({
  tag: 'slot-replace-wrapper-root',
})
export class SlotReplaceWrapperRoot {
  @State() href?: string;

  componentDidLoad() {
    this.href = 'http://stenciljs.com/';
  }

  render() {
    return (
      <main>
        <slot-replace-wrapper href={this.href} class="results1">
          <content-end slot="start">A</content-end>
        </slot-replace-wrapper>

        <slot-replace-wrapper href={this.href} class="results2">
          <content-end>B</content-end>
        </slot-replace-wrapper>

        <slot-replace-wrapper href={this.href} class="results3">
          <content-end slot="end">C</content-end>
        </slot-replace-wrapper>

        <slot-replace-wrapper href={this.href} class="results4">
          <content-start slot="start">A</content-start>
          <content-default>B</content-default>
          <content-end slot="end">C</content-end>
        </slot-replace-wrapper>

        <slot-replace-wrapper href={this.href} class="results5">
          <content-default>B</content-default>
          <content-end slot="end">C</content-end>
          <content-start slot="start">A</content-start>
        </slot-replace-wrapper>

        <slot-replace-wrapper href={this.href} class="results6">
          <content-end slot="end">C</content-end>
          <content-start slot="start">A</content-start>
          <content-default>B</content-default>
        </slot-replace-wrapper>

        <slot-replace-wrapper href={this.href} class="results7">
          <content-start slot="start">A1</content-start>
          <content-start slot="start">A2</content-start>
          <content-default>B1</content-default>
          <content-default>B2</content-default>
          <content-end slot="end">C1</content-end>
          <content-end slot="end">C2</content-end>
        </slot-replace-wrapper>

        <slot-replace-wrapper href={this.href} class="results8">
          <content-default>B1</content-default>
          <content-end slot="end">C1</content-end>
          <content-start slot="start">A1</content-start>
          <content-default>B2</content-default>
          <content-end slot="end">C2</content-end>
          <content-start slot="start">A2</content-start>
        </slot-replace-wrapper>
      </main>
    );
  }
}
