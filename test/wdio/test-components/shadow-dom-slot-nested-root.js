import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-CCVzHIBh.js';

const ShadowDomSlotNestedRoot$1 = /*@__PURE__*/ proxyCustomElement(class ShadowDomSlotNestedRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        const nested = [0, 1, 2].map((i) => {
            return h("shadow-dom-slot-nested", { i: i }, "light dom: ", i);
        });
        return [h("section", null, "shadow-dom-slot-nested"), h("article", null, nested)];
    }
    static get style() { return `:host {
      color: green;
      font-weight: bold;
    }`; }
}, [1, "shadow-dom-slot-nested-root"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["shadow-dom-slot-nested-root", "shadow-dom-slot-nested"];
    components.forEach(tagName => { switch (tagName) {
        case "shadow-dom-slot-nested-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ShadowDomSlotNestedRoot$1);
            }
            break;
        case "shadow-dom-slot-nested":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const ShadowDomSlotNestedRoot = ShadowDomSlotNestedRoot$1;
const defineCustomElement = defineCustomElement$1;

export { ShadowDomSlotNestedRoot, defineCustomElement };
