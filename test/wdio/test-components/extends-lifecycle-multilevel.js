import { H, p as proxyCustomElement, h, t as transformTag } from './p-DYdAJnXF.js';

const GrandparentBase = class extends H {
    constructor() {
        super(false);
    }
    // Lifecycle methods at the top level of inheritance
    componentWillLoad() {
        window.lifecycleCalls = window.lifecycleCalls || [];
        window.lifecycleCalls.push('GrandparentBase.componentWillLoad');
    }
    componentDidLoad() {
        window.lifecycleCalls = window.lifecycleCalls || [];
        window.lifecycleCalls.push('GrandparentBase.componentDidLoad');
    }
    componentWillRender() {
        window.lifecycleCalls = window.lifecycleCalls || [];
        window.lifecycleCalls.push('GrandparentBase.componentWillRender');
    }
    componentDidRender() {
        window.lifecycleCalls = window.lifecycleCalls || [];
        window.lifecycleCalls.push('GrandparentBase.componentDidRender');
    }
    componentWillUpdate() {
        window.lifecycleCalls = window.lifecycleCalls || [];
        window.lifecycleCalls.push('GrandparentBase.componentWillUpdate');
    }
    componentDidUpdate() {
        window.lifecycleCalls = window.lifecycleCalls || [];
        window.lifecycleCalls.push('GrandparentBase.componentDidUpdate');
    }
};

const ParentBase = class extends GrandparentBase {
    constructor() {
        super(false);
    }
    // Override lifecycle methods to call super() and add our own tracking
    componentWillLoad() {
        super.componentWillLoad();
        window.lifecycleCalls = window.lifecycleCalls || [];
        window.lifecycleCalls.push('ParentBase.componentWillLoad');
    }
    componentDidLoad() {
        super.componentDidLoad();
        window.lifecycleCalls = window.lifecycleCalls || [];
        window.lifecycleCalls.push('ParentBase.componentDidLoad');
    }
    componentWillRender() {
        super.componentWillRender();
        window.lifecycleCalls = window.lifecycleCalls || [];
        window.lifecycleCalls.push('ParentBase.componentWillRender');
    }
    componentDidRender() {
        super.componentDidRender();
        window.lifecycleCalls = window.lifecycleCalls || [];
        window.lifecycleCalls.push('ParentBase.componentDidRender');
    }
    componentWillUpdate() {
        super.componentWillUpdate();
        window.lifecycleCalls = window.lifecycleCalls || [];
        window.lifecycleCalls.push('ParentBase.componentWillUpdate');
    }
    componentDidUpdate() {
        super.componentDidUpdate();
        window.lifecycleCalls = window.lifecycleCalls || [];
        window.lifecycleCalls.push('ParentBase.componentDidUpdate');
    }
};

const MultiLevelLifecycleCmp = /*@__PURE__*/ proxyCustomElement(class MultiLevelLifecycleCmp extends ParentBase {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
        // State for testing updates
        this.value = '';
    }
    // Override lifecycle methods to call super() and add component-level tracking
    componentWillLoad() {
        super.componentWillLoad();
        window.lifecycleCalls = window.lifecycleCalls || [];
        window.lifecycleCalls.push('Component.componentWillLoad');
    }
    componentDidLoad() {
        super.componentDidLoad();
        window.lifecycleCalls = window.lifecycleCalls || [];
        window.lifecycleCalls.push('Component.componentDidLoad');
    }
    componentWillRender() {
        super.componentWillRender();
        window.lifecycleCalls = window.lifecycleCalls || [];
        window.lifecycleCalls.push('Component.componentWillRender');
    }
    componentDidRender() {
        super.componentDidRender();
        window.lifecycleCalls = window.lifecycleCalls || [];
        window.lifecycleCalls.push('Component.componentDidRender');
    }
    componentWillUpdate() {
        super.componentWillUpdate();
        window.lifecycleCalls = window.lifecycleCalls || [];
        window.lifecycleCalls.push('Component.componentWillUpdate');
    }
    componentDidUpdate() {
        super.componentDidUpdate();
        window.lifecycleCalls = window.lifecycleCalls || [];
        window.lifecycleCalls.push('Component.componentDidUpdate');
    }
    // Method to trigger update lifecycle for testing
    triggerUpdate() {
        this.value = 'updated';
    }
    render() {
        return (h("div", { key: '53d40d2b785afd445d8a86badb2915f0fcd50069' }, h("h2", { key: '3f3ebc9625f84bf1c8b931a2d46f8793d7c2665e' }, "Multi-Level Lifecycle Inheritance Test"), h("p", { key: '36c033d9ea1b3ec9c325a4ada73d0677c5bdb5c8', class: "current-value" }, "Current Value: ", this.value), h("button", { key: 'f5f8fd6f64da044ade83986ca194c729133b6886', class: "trigger-update", onClick: () => this.triggerUpdate() }, "Trigger Update"), h("div", { key: '9e7cbb7fadf32ac02d267a4c49fa380e49373789', class: "lifecycle-info" }, h("h3", { key: 'c14a0cf35ea212e5b9b69fe35469fd2120b38cfa' }, "Inheritance Chain: Component \u2192 ParentBase \u2192 GrandparentBase"), h("p", { key: 'fc63c9ecec06a70cd578920d9d6f4fefc42b764b', class: "lifecycle-count" }, "Total lifecycle events: ", (window.lifecycleCalls || []).length))));
    }
}, [512, "extends-lifecycle-multilevel", {
        "value": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["extends-lifecycle-multilevel"];
    components.forEach(tagName => { switch (tagName) {
        case "extends-lifecycle-multilevel":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), MultiLevelLifecycleCmp);
            }
            break;
    } });
}

const ExtendsLifecycleMultilevel = MultiLevelLifecycleCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsLifecycleMultilevel, defineCustomElement };
