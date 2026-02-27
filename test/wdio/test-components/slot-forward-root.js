import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-B3etidR3.js';

const MyComponent = /*@__PURE__*/ proxyCustomElement(class MyComponent extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h(Host, { key: '07678eb8625ae6fcea315e6d4303ff080d66c811' }, h("slot-forward-child-fallback", { key: 'ce29da98327196eae6c57eb7a158b17b1e3ee098', label: this.label }, h("slot", { key: '5dd8cfd028cdb7af868828f8b10e3f45980bd40c', name: "label" }))));
    }
    static get style() { return `.sc-slot-forward-root-h {
      display: block;
    }`; }
}, [262, "slot-forward-root", {
        "label": [1]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-forward-root", "slot-forward-child-fallback"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-forward-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), MyComponent);
            }
            break;
        case "slot-forward-child-fallback":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const SlotForwardRoot = MyComponent;
const defineCustomElement = defineCustomElement$1;

export { SlotForwardRoot, defineCustomElement };
