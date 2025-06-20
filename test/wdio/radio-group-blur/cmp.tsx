import { Component, h, State } from '@stencil/core';

@Component({
  tag: 'radio-group-blur-test',
})
export class RadioGroupBlurTest {
  @State() blurCount = 0;
  @State() focusCount = 0;

  private onBlur = () => {
    console.log('🔥 onBlur called, current count:', this.blurCount);
    this.blurCount++;
    console.log('🔥 onBlur new count:', this.blurCount);
  };

  private onFocus = () => {
    console.log('🎯 onFocus called, current count:', this.focusCount);
    this.focusCount++;
    console.log('🎯 onFocus new count:', this.focusCount);
  };

  render() {
    return (
      <div>
        <h1>Radio Group Blur Test</h1>
        <p>
          Focus Count: <span id="focus-count">{this.focusCount}</span>
        </p>
        <p>
          Blur Count: <span id="blur-count">{this.blurCount}</span>
        </p>

        <test-radio-group>
          <test-radio onIonFocus={this.onFocus} onIonBlur={this.onBlur} id="radio1">
            Option 1
          </test-radio>
        </test-radio-group>

        <button
          id="focus-button"
          onClick={() => {
            console.log('🖱️ Button clicked - calling radio.focus()');
            const radio = document.getElementById('radio1');
            if (radio) {
              console.log('📍 Found radio element:', radio.tagName);
              radio.focus();
              console.log('✅ radio.focus() called');
            } else {
              console.log('❌ Radio element not found');
            }
          }}
        >
          Focus Radio
        </button>
      </div>
    );
  }
}
