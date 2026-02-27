import { p as proxyCustomElement, H, h, t as transformTag } from './index.js';

var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
        r = Reflect.decorate(decorators, target, key, desc);
    else
        for (var i = decorators.length - 1; i >= 0; i--)
            if (d = decorators[i])
                r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
function AddDynamicLifeCycleHooks() {
    return (target) => {
        window.lifecycleCalls = [];
        const { connectedCallback, disconnectedCallback, componentWillRender, componentDidRender, componentWillLoad, componentDidLoad, componentShouldUpdate, componentWillUpdate, componentDidUpdate, } = target;
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
            if (componentShouldUpdate)
                return componentShouldUpdate.apply(this, args);
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
            get() {
                return window.lifecycleCalls;
            },
            configurable: true,
            enumerable: true,
        };
    };
}
function Clamp(lowerBound, upperBound, descriptor) {
    const clamp = (value) => Math.max(lowerBound, Math.min(value, upperBound));
    return (target, propertyKey) => {
        descriptor = descriptor || Object.getOwnPropertyDescriptor(target, propertyKey);
        // preserve any existing getter/setter
        const ogGet = descriptor === null || descriptor === void 0 ? void 0 : descriptor.get;
        const ogSet = descriptor === null || descriptor === void 0 ? void 0 : descriptor.set;
        const key = Symbol();
        return {
            get() {
                if (ogGet)
                    return clamp(ogGet.call(this));
                return clamp(this[key]);
            },
            set(newValue) {
                if (ogSet)
                    ogSet.call(this, newValue);
                this[key] = newValue;
            },
            configurable: true,
            enumerable: true,
        };
    };
}
const TsTargetProps$1 = /*@__PURE__*/ proxyCustomElement(class TsTargetProps extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    get el() { return this; }
    basicProp = 'basicProp';
    decoratedProp = -10;
    _decoratedGetterSetterProp = 1000;
    get decoratedGetterSetterProp() {
        return this._decoratedGetterSetterProp || 0;
    }
    set decoratedGetterSetterProp(value) {
        this._decoratedGetterSetterProp = value;
    }
    basicState = 'basicState';
    decoratedState = 11;
    dynamicLifecycle;
    // Don't add any static lifecycle hooks here.
    // They will be added dynamically by the decorator.
    // This test will only work via the `stencil.config-es2022.ts` / `tsconfig-es2022.json` combo
    // Because as soon as one component uses a static lifecycle hook,
    // all components can dynamically use it.
    render() {
        return (h("div", { key: '438ea40203899ad6fac96e152bd0f0750ba524ae' }, h("div", { key: '60194416d090d14e15e59b1b3adc7f4ad419e889', class: "basicProp" }, this.basicProp), h("div", { key: 'ce734be1e868e0af36f04bea0c4ad9bf1b9617aa', class: "decoratedProp" }, this.decoratedProp), h("div", { key: '24a2a2a6e2cf4f13ff650da818c2e2b7fabf9ea0', class: "decoratedGetterSetterProp" }, this.decoratedGetterSetterProp), h("div", { key: 'c9ac827b55442d7972b19e471f57abc501b62ac8', class: "basicState" }, this.basicState), h("button", { key: '91e078e0c589746b236c54d316debe80e76b9dc4', onClick: () => {
                this.basicState += ' changed ';
            } }, "Change basicState"), h("div", { key: 'a4e44335e3f5eb5e784790c7a1d927ec6f3d4c71', class: "decoratedState" }, this.decoratedState), h("button", { key: '15678ce9098127a905633ffafbb4869fc68cf2c8', onClick: () => {
                this.decoratedState -= 100;
            } }, "Change decoratedState")));
    }
}, [512, "ts-target-props", {
        "basicProp": [1, "basic-prop"],
        "decoratedProp": [2, "decorated-prop"],
        "decoratedGetterSetterProp": [6146, "decorated-getter-setter-prop"],
        "dynamicLifecycle": [16],
        "basicState": [32],
        "decoratedState": [32]
    }]);
__decorate([
    Clamp(-5, 25)
], TsTargetProps$1.prototype, "decoratedProp", void 0);
__decorate([
    Clamp(0, 999)
], TsTargetProps$1.prototype, "decoratedGetterSetterProp", null);
__decorate([
    Clamp(0, 10)
], TsTargetProps$1.prototype, "decoratedState", void 0);
__decorate([
    AddDynamicLifeCycleHooks()
], TsTargetProps$1.prototype, "dynamicLifecycle", void 0);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["ts-target-props"];
    components.forEach(tagName => { switch (tagName) {
        case "ts-target-props":
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), TsTargetProps$1);
            }
            break;
    } });
}
defineCustomElement$1();

const TsTargetProps = TsTargetProps$1;
const defineCustomElement = defineCustomElement$1;

export { TsTargetProps, defineCustomElement };
//# sourceMappingURL=ts-target-props.js.map

//# sourceMappingURL=ts-target-props.js.map