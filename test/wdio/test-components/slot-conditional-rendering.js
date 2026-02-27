import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const SlotConditionalRendering$1 = /*@__PURE__*/ proxyCustomElement(class SlotConditionalRendering extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.headerVisible = true;
        this.contentVisible = true;
    }
    render() {
        return (h(Host, { key: '48c41b18f435f29d522b9d2488b71ab88b385f09' }, this.headerVisible ? h("slot", { name: "header" }) : null, this.contentVisible ? h("slot", null) : null, h("button", { key: 'af3a9c1f9fa30fdfedc145bdfb9f2b70e56a3b61', id: "header-visibility-toggle", onClick: () => (this.headerVisible = !this.headerVisible) }, "Toggle header visibility (to ", this.headerVisible ? 'hidden' : 'visible', ")"), h("button", { key: '35fbab395a2e4e47446414fd68ee4e2f46bb44ea', id: "content-visibility-toggle", onClick: () => (this.contentVisible = !this.contentVisible) }, "Toggle content visibility (to ", this.contentVisible ? 'hidden' : 'visible', ")")));
    }
}, [262, "slot-conditional-rendering", {
        "headerVisible": [32],
        "contentVisible": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-conditional-rendering"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-conditional-rendering":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotConditionalRendering$1);
            }
            break;
    } });
}

const SlotConditionalRendering = SlotConditionalRendering$1;
const defineCustomElement = defineCustomElement$1;

export { SlotConditionalRendering, defineCustomElement };
