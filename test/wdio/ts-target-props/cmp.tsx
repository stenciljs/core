import { Component, ComponentInterface, Element, h, Prop, State } from '@stencil/core';

declare global {
  interface Window {
    lifecycleCalls: string[];
  }
}

function AddDynamicLifeCycleHooks(): any {
  return <T extends ComponentInterface>(target: T) => {
    window.lifecycleCalls = [];
    const {
      connectedCallback,
      disconnectedCallback,
      componentWillRender,
      componentDidRender,
      componentWillLoad,
      componentDidLoad,
      componentShouldUpdate,
      componentWillUpdate,
      componentDidUpdate,
    } = target;

    target.connectedCallback = function () {
      window.lifecycleCalls.push('connectedCallback');
      return connectedCallback?.call(this);
    };
    target.disconnectedCallback = function () {
      window.lifecycleCalls.push('disconnectedCallback');
      return disconnectedCallback?.call(this);
    };
    target.componentWillRender = function () {
      window.lifecycleCalls.push('componentWillRender');
      return componentWillRender?.call(this);
    };
    target.componentDidRender = function () {
      window.lifecycleCalls.push('componentDidRender');
      return componentDidRender?.call(this);
    };
    target.componentWillLoad = function () {
      window.lifecycleCalls.push('componentWillLoad');
      return componentWillLoad?.call(this);
    };
    target.componentDidLoad = function () {
      window.lifecycleCalls.push('componentDidLoad');
      return componentDidLoad?.call(this);
    };
    target.componentShouldUpdate = function (...args) {
      window.lifecycleCalls.push('componentShouldUpdate');
      if (componentShouldUpdate) return componentShouldUpdate.apply(this, args);
      return true;
    };
    target.componentWillUpdate = function () {
      window.lifecycleCalls.push('componentWillUpdate');
      return componentWillUpdate?.call(this);
    };
    target.componentDidUpdate = function () {
      window.lifecycleCalls.push('componentDidUpdate');
      return componentDidUpdate?.call(this);
    };

    return {
      get(): string[] {
        return window.lifecycleCalls;
      },
      configurable: true,
      enumerable: true,
    };
  };
}

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
  tag: 'ts-target-props',
})
export class TsTargetProps implements ComponentInterface {
  @Element() el: HTMLElement;

  @Prop() basicProp: string = 'basicProp';

  @Clamp(-5, 25)
  @Prop()
  decoratedProp: number = -10;

  private _decoratedGetterSetterProp: number = 1000;
  @Clamp(0, 999)
  @Prop()
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

  @AddDynamicLifeCycleHooks()
  @Prop()
  dynamicLifecycle: string[];

  // Don't add any static lifecycle hooks here.
  // They will be added dynamically by the decorator.
  // This test will only work via the `stencil.config-es2022.ts` / `tsconfig-es2022.json` combo
  // Because as soon as one component uses a static lifecycle hook,
  // all components can dynamically use it.

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
