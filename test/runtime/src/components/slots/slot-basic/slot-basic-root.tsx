import { Component, h, State } from '@stencil/core';

const textA = 'A';
const spanA = <span>A</span>;
const divA = <div>A</div>;

const textB = 'B';
const spanB = <span>B</span>;
const divB = <div>B</div>;
const divC = <div>C</div>;

@Component({
  tag: 'slot-basic-root',
})
export class SlotBasicRoot {
  @State() inc = 1;

  testClick() {
    this.inc++;
  }

  render() {
    return (
      <div>
        <button onClick={this.testClick.bind(this)} class="test">
          Test
        </button>

        <div class="inc">Rendered: {this.inc}</div>

        <div class="results1">
          <slot-basic>
            {textA}
            {textB}
          </slot-basic>
        </div>

        <div class="results2">
          <slot-basic>
            {textA}
            {spanB}
          </slot-basic>
        </div>

        <div class="results3">
          <slot-basic>
            {textA}
            {divB}
          </slot-basic>
        </div>

        <div class="results4">
          <slot-basic>
            <footer>
              {textA}
              {divB}
            </footer>
          </slot-basic>
        </div>

        <div class="results5">
          <slot-basic>
            {spanA}
            {textB}
          </slot-basic>
        </div>

        <div class="results6">
          <slot-basic>
            {spanA}
            {spanB}
          </slot-basic>
        </div>

        <div class="results7">
          <slot-basic>
            {spanA}
            {divB}
          </slot-basic>
        </div>

        <div class="results8">
          <slot-basic>
            {divA}
            {textB}
          </slot-basic>
        </div>

        <div class="results9">
          <slot-basic>
            {divA}
            {spanB}
          </slot-basic>
        </div>

        <div class="results10">
          <slot-basic>
            {divA}
            {divB}
          </slot-basic>
        </div>

        <div class="results11">
          <slot-basic>
            {divA}
            <footer>{divB}</footer>
            {divC}
          </slot-basic>
        </div>
      </div>
    );
  }
}
