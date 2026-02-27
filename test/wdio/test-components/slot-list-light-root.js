import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$3 } from './p-D_BIn9Hv.js';
import { d as defineCustomElement$2 } from './p-wtNCoAIs.js';

const SlotListLightRoot$1 = /*@__PURE__*/ proxyCustomElement(class SlotListLightRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.items = [];
    }
    needMore() {
        const newItems = [
            `Item ${this.items.length + 1}`,
            `Item ${this.items.length + 2}`,
            `Item ${this.items.length + 3}`,
            `Item ${this.items.length + 4}`,
        ];
        this.items = [...this.items, ...newItems];
    }
    render() {
        return (h("div", { key: '10dd68d098d0a2f9a6ecbb5a45cdd0e65a53ec2c' }, h("button", { key: 'b78e72530bceb472e2ccc93c379195db2789642c', onClick: () => this.needMore() }, "More"), h("slot-dynamic-shadow-list", { key: 'e0353995fee482031815ede9feb07a4c92f90acf', items: this.items })));
    }
}, [0, "slot-list-light-root", {
        "items": [1040]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-list-light-root", "slot-dynamic-shadow-list", "slot-light-list"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-list-light-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotListLightRoot$1);
            }
            break;
        case "slot-dynamic-shadow-list":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$3();
            }
            break;
        case "slot-light-list":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const SlotListLightRoot = SlotListLightRoot$1;
const defineCustomElement = defineCustomElement$1;

export { SlotListLightRoot, defineCustomElement };
