import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-BMjaFjC4.js';

const SlotParentTagChangeRoot$1 = /*@__PURE__*/ proxyCustomElement(class SlotParentTagChangeRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.element = 'p';
    }
    render() {
        return (h("slot-parent-tag-change", { key: 'a892cfdfcf8b912c1d6351007b86fde19d3c2bb6', element: this.element }, h("slot", { key: 'ab0d57e815254abc32756aa9698d5d556be9e1b3' })));
    }
}, [260, "slot-parent-tag-change-root", {
        "element": [1]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-parent-tag-change-root", "slot-parent-tag-change"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-parent-tag-change-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotParentTagChangeRoot$1);
            }
            break;
        case "slot-parent-tag-change":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const SlotParentTagChangeRoot = SlotParentTagChangeRoot$1;
const defineCustomElement = defineCustomElement$1;

export { SlotParentTagChangeRoot, defineCustomElement };
