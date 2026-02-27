import { H, t as transformTag, p as proxyCustomElement, h } from './index.js';

const LifecycleBase = class extends H {
    constructor() {
        super(false);
    }
    // Lifecycle methods that will be inherited - track to global array (no render loops)
    componentWillLoad() {
        window.lifecycleCalls = window.lifecycleCalls || [];
        window.lifecycleCalls.push('componentWillLoad');
    }
    componentDidLoad() {
        window.lifecycleCalls = window.lifecycleCalls || [];
        window.lifecycleCalls.push('componentDidLoad');
    }
    componentWillRender() {
        window.lifecycleCalls = window.lifecycleCalls || [];
        window.lifecycleCalls.push('componentWillRender');
    }
    componentDidRender() {
        window.lifecycleCalls = window.lifecycleCalls || [];
        window.lifecycleCalls.push('componentDidRender');
    }
    componentWillUpdate() {
        window.lifecycleCalls = window.lifecycleCalls || [];
        window.lifecycleCalls.push('componentWillUpdate');
    }
    componentDidUpdate() {
        window.lifecycleCalls = window.lifecycleCalls || [];
        window.lifecycleCalls.push('componentDidUpdate');
    }
};

const LifecycleCmp = /*@__PURE__*/ proxyCustomElement(class LifecycleCmp extends LifecycleBase {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    // State for testing updates
    value = '';
    // Method to trigger update lifecycle for testing
    triggerUpdate() {
        this.value = 'updated';
    }
    render() {
        return (h("div", { key: '91ea4735e563984ff6a33e9d8434ea4be604030b' }, h("h2", { key: 'e7bfdea81171cd5cce214e683cce5cb449fd94fb' }, "Lifecycle Inheritance Test"), h("p", { key: '2cd3f3cce88adf6f9a700e9b8bf08fde2fc1d4b3', class: "current-value" }, "Current Value: ", this.value), h("button", { key: '2b4e656e0b7e0f2513725ece322940081fb6d726', class: "trigger-update", onClick: () => this.triggerUpdate() }, "Trigger Update"), h("div", { key: '3d8734e2d684da56c8708d8733dedc31a8b75d58', class: "lifecycle-events" }, h("h3", { key: '2471b6171129df052201e8e1ccb149c3d68a6be7' }, "Lifecycle Events tracked to window.lifecycleCalls"), h("p", { key: '9ad1f2066ba8b41d7f78b10574179fd3b33fc96b', class: "lifecycle-info" }, "Events: ", (window.lifecycleCalls || []).length, " total"))));
    }
}, [512, "extends-lifecycle-basic", {
        "value": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["extends-lifecycle-basic"];
    components.forEach(tagName => { switch (tagName) {
        case "extends-lifecycle-basic":
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), LifecycleCmp);
            }
            break;
    } });
}
defineCustomElement$1();

const ExtendsLifecycleBasic = LifecycleCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsLifecycleBasic, defineCustomElement };
//# sourceMappingURL=extends-lifecycle-basic.js.map

//# sourceMappingURL=extends-lifecycle-basic.js.map