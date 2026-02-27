import { H, t as transformTag, p as proxyCustomElement, h } from './index.js';

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
    }
    // State for testing updates
    value = '';
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
        return (h("div", { key: 'e92d013a5bdb0d0fba3eff05aa342685a58596fd' }, h("h2", { key: '99f6e462252a1f4aa1fcb7c9a48cf48469b69268' }, "Multi-Level Lifecycle Inheritance Test"), h("p", { key: '773f9066298ea03e9905f4f0176e4e4be895fd49', class: "current-value" }, "Current Value: ", this.value), h("button", { key: 'd559800fbf1087ab787f3bd1492a0fe16d66ac74', class: "trigger-update", onClick: () => this.triggerUpdate() }, "Trigger Update"), h("div", { key: '06b2ae778abbec8c4d405f5086a1d2bbaa8b86ac', class: "lifecycle-info" }, h("h3", { key: 'ea2d6010aa29c34060ff4656d29c5934ff5c7666' }, "Inheritance Chain: Component \u2192 ParentBase \u2192 GrandparentBase"), h("p", { key: '55270f66cbcdef4c0d430e777d690bb7a1440767', class: "lifecycle-count" }, "Total lifecycle events: ", (window.lifecycleCalls || []).length))));
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
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), MultiLevelLifecycleCmp);
            }
            break;
    } });
}
defineCustomElement$1();

const ExtendsLifecycleMultilevel = MultiLevelLifecycleCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsLifecycleMultilevel, defineCustomElement };
//# sourceMappingURL=extends-lifecycle-multilevel.js.map

//# sourceMappingURL=extends-lifecycle-multilevel.js.map