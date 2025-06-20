import { Component, Element, h, State } from '@stencil/core';

@Component({
  tag: 'radio-group-blur-test',
})
export class RadioGroupBlurTest {
  @Element() el: HTMLElement;
  @State() blurCount = 0;

  componentDidLoad = () => {
    setTimeout(() => {
      // The issue: blue is called on focus of the first radio only reproduces
      // when the radios are dynamically added with a timeout
      const radioGroup = document.getElementById('radio-group');
      for (let i = 0; i < 3; i++) {
        const radio = document.createElement('ion-radio');
        radio.value = `radio-${i}`;
        radio.textContent = `Radio ${i}`;
        radioGroup?.appendChild(radio);
      }
    }, 100);

    // listen for radio `ionBlur` on all radios
    document.addEventListener('ionBlur', () => {
      this.blurCount++;
    });
  };

  render() {
    return (
      <div>
        <h1>Radio Group Blur Test</h1>
        <p>
          Blur Count: <span id="blur-count">{this.blurCount}</span>
        </p>

        <ion-radio-group id="radio-group"></ion-radio-group>
      </div>
    );
  }
}
