import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const ScopedSlotAppendAndPrepend$1 = /*@__PURE__*/ proxyCustomElement(class ScopedSlotAppendAndPrepend extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: '983a9365af81f3bf6ef2aa5e35ac16bb0918b567', id: "parentDiv", style: { background: 'red' } }, "Here is my slot. It is red.", h("slot", { key: '8b7d3fb853f3470aea80024ecfb76b7f6bd703b6' })));
    }
}, [262, "scoped-slot-append-and-prepend"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["scoped-slot-append-and-prepend"];
    components.forEach(tagName => { switch (tagName) {
        case "scoped-slot-append-and-prepend":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ScopedSlotAppendAndPrepend$1);
            }
            break;
    } });
}

const ScopedSlotAppendAndPrepend = ScopedSlotAppendAndPrepend$1;
const defineCustomElement = defineCustomElement$1;

export { ScopedSlotAppendAndPrepend, defineCustomElement };
