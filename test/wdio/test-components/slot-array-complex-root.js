import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-3yRTs0N8.js';

const SlotArrayComplexRoot$1 = /*@__PURE__*/ proxyCustomElement(class SlotArrayComplexRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.endSlot = false;
    }
    componentDidLoad() {
        this.endSlot = !this.endSlot;
    }
    render() {
        return (h("main", { key: '65f9833cdb1d4a76a6f5dfa06762de7ac3ed31eb' }, h("slot-array-complex", { key: 'ec644c7783470c3ad948981eb1b2b494cd693274' }, h("header", { key: '30fc700607745113d1a77a50a7b75f704ae344d6', slot: "start" }, "slot - start"), "slot - default", this.endSlot ? h("footer", { slot: "end" }, "slot - end") : null)));
    }
}, [0, "slot-array-complex-root", {
        "endSlot": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-array-complex-root", "slot-array-complex"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-array-complex-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotArrayComplexRoot$1);
            }
            break;
        case "slot-array-complex":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const SlotArrayComplexRoot = SlotArrayComplexRoot$1;
const defineCustomElement = defineCustomElement$1;

export { SlotArrayComplexRoot, defineCustomElement };
