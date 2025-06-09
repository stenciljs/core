import { Component, Element, h, Prop, State } from '@stencil/core';

function Clamp(lowerBound: number, upperBound: number, descriptor?: PropertyDescriptor): any {
  const clamp = (value: number) => Math.max(lowerBound, Math.min(value, upperBound));

  return <T,>(target: T, propertyKey: string) => {
    descriptor = descriptor || Object.getOwnPropertyDescriptor(target, propertyKey);
    // preserve any existing getter/setter
    const ogGet = descriptor === null || descriptor === void 0 ? void 0 : descriptor.get;
    const ogSet = descriptor === null || descriptor === void 0 ? void 0 : descriptor.set;
    const key = Symbol() as keyof T;

    return {
      get(): number {
        if (ogGet) return clamp(ogGet.call(this));
        return clamp((this as unknown as T)[key] as number);
      },
      set(newValue: number) {
        if (ogSet) ogSet.call(this, newValue);
        ((this as unknown as T)[key] as number) = newValue;
      },
      configurable: true,
      enumerable: true,
    };
  };
}

@Component({
  tag: 'runtime-decorators',
})
export class RunTimeDecorators {
  @Element() el: HTMLElement;

  @Prop({ reflect: true }) basicProp: string = 'basicProp';

  @Clamp(-5, 25)
  @Prop({ reflect: true })
  decoratedProp: number = -10;

  private _decoratedGetterSetterProp: number = 1000;
  @Clamp(0, 999)
  @Prop({ reflect: true })
  get decoratedGetterSetterProp() {
    return this._decoratedGetterSetterProp || 0;
  }
  set decoratedGetterSetterProp(value: number) {
    this._decoratedGetterSetterProp = value;
  }

  @State() basicState: string = 'basicState';

  @Clamp(0, 10)
  @State()
  decoratedState: number = 11;

  render() {
    return (
      <div>
        <div class="basicProp">{this.basicProp}</div>
        <div class="decoratedProp">{this.decoratedProp}</div>
        <div class="decoratedGetterSetterProp">{this.decoratedGetterSetterProp}</div>
        <div class="basicState">{this.basicState}</div>

        <button
          onClick={() => {
            this.basicState += ' changed ';
          }}
        >
          Change basicState
        </button>

        <div class="decoratedState">{this.decoratedState}</div>
        <button
          onClick={() => {
            this.decoratedState -= 100;
          }}
        >
          Change decoratedState
        </button>
      </div>
    );
  }
}
