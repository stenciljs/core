import { H, p as proxyCustomElement, h, t as transformTag } from './p-DYdAJnXF.js';

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
        // State for testing updates
        this.value = '';
    }
    // Method to trigger update lifecycle for testing
    triggerUpdate() {
        this.value = 'updated';
    }
    render() {
        return (h("div", { key: 'c75fb050c3ab8cb8558e987247a4165e5392b06a' }, h("h2", { key: 'd1248e5d8c07290f558b8db9ce69af2482159bf6' }, "Lifecycle Inheritance Test"), h("p", { key: '8c6c1c2be75666854ba92791e55053780328d34f', class: "current-value" }, "Current Value: ", this.value), h("button", { key: '15e6c7f64b3f93e4357a67f8284197714be7c670', class: "trigger-update", onClick: () => this.triggerUpdate() }, "Trigger Update"), h("div", { key: 'ff2fb24cd2e16888dab37a084575b090904cecc2', class: "lifecycle-events" }, h("h3", { key: '56782291561dc57d08cbda1fe14aa9789fcb67a9' }, "Lifecycle Events tracked to window.lifecycleCalls"), h("p", { key: 'dd8529e4371554df2a49b240681b08006cdb1c24', class: "lifecycle-info" }, "Events: ", (window.lifecycleCalls || []).length, " total"))));
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
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), LifecycleCmp);
            }
            break;
    } });
}

const ExtendsLifecycleBasic = LifecycleCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsLifecycleBasic, defineCustomElement };
