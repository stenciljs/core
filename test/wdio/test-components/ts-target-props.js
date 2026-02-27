import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

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
            return connectedCallback === null || connectedCallback === void 0 ? void 0 : connectedCallback.call(this);
        };
        target.disconnectedCallback = function () {
            window.lifecycleCalls.push('disconnectedCallback');
            return disconnectedCallback === null || disconnectedCallback === void 0 ? void 0 : disconnectedCallback.call(this);
        };
        target.componentWillRender = function () {
            window.lifecycleCalls.push('componentWillRender');
            return componentWillRender === null || componentWillRender === void 0 ? void 0 : componentWillRender.call(this);
        };
        target.componentDidRender = function () {
            window.lifecycleCalls.push('componentDidRender');
            return componentDidRender === null || componentDidRender === void 0 ? void 0 : componentDidRender.call(this);
        };
        target.componentWillLoad = function () {
            window.lifecycleCalls.push('componentWillLoad');
            return componentWillLoad === null || componentWillLoad === void 0 ? void 0 : componentWillLoad.call(this);
        };
        target.componentDidLoad = function () {
            window.lifecycleCalls.push('componentDidLoad');
            return componentDidLoad === null || componentDidLoad === void 0 ? void 0 : componentDidLoad.call(this);
        };
        target.componentShouldUpdate = function (...args) {
            window.lifecycleCalls.push('componentShouldUpdate');
            if (componentShouldUpdate)
                return componentShouldUpdate.apply(this, args);
            return true;
        };
        target.componentWillUpdate = function () {
            window.lifecycleCalls.push('componentWillUpdate');
            return componentWillUpdate === null || componentWillUpdate === void 0 ? void 0 : componentWillUpdate.call(this);
        };
        target.componentDidUpdate = function () {
            window.lifecycleCalls.push('componentDidUpdate');
            return componentDidUpdate === null || componentDidUpdate === void 0 ? void 0 : componentDidUpdate.call(this);
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
        this.basicProp = 'basicProp';
        this.decoratedProp = -10;
        this._decoratedGetterSetterProp = 1000;
        this.basicState = 'basicState';
        this.decoratedState = 11;
    }
    get decoratedGetterSetterProp() {
        return this._decoratedGetterSetterProp || 0;
    }
    set decoratedGetterSetterProp(value) {
        this._decoratedGetterSetterProp = value;
    }
    // Don't add any static lifecycle hooks here.
    // They will be added dynamically by the decorator.
    // This test will only work via the `stencil.config-es2022.ts` / `tsconfig-es2022.json` combo
    // Because as soon as one component uses a static lifecycle hook,
    // all components can dynamically use it.
    render() {
        return (h("div", { key: '8932c6ae45b0e25dc81fa0a023cf2b2262b6a589' }, h("div", { key: 'c5fa1dd3f1f89b6aa15b91503459cad471fe74fd', class: "basicProp" }, this.basicProp), h("div", { key: 'fb5d38ec32a4db5b7cf995eab6f89a5bc4fde888', class: "decoratedProp" }, this.decoratedProp), h("div", { key: '59d147c067a503eb03ef01a59a45e07e9c02628b', class: "decoratedGetterSetterProp" }, this.decoratedGetterSetterProp), h("div", { key: '84529559261d3bdb60182e28261d3ab5d0f087d6', class: "basicState" }, this.basicState), h("button", { key: '446f236c7a7a6e1d50425c66c4807379cec75fbb', onClick: () => {
                this.basicState += ' changed ';
            } }, "Change basicState"), h("div", { key: '4cf5d1c7bc7b2dfb5e36ccea2fcb64ff89d68978', class: "decoratedState" }, this.decoratedState), h("button", { key: '19a37a9e19eef0357c0ba4db06c7433656fc2a12', onClick: () => {
                this.decoratedState -= 100;
            } }, "Change decoratedState")));
    }
    get el() { return this; }
}, [0, "ts-target-props", {
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
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), TsTargetProps$1);
            }
            break;
    } });
}

const TsTargetProps = TsTargetProps$1;
const defineCustomElement = defineCustomElement$1;

export { TsTargetProps, defineCustomElement };
