import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$3 } from './p-CFc6tsmL.js';
import { d as defineCustomElement$2 } from './p-BF3S6d6L.js';

const SlotListLightScopedRoot$1 = /*@__PURE__*/ proxyCustomElement(class SlotListLightScopedRoot extends H {
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
        return (h("div", { key: 'aa0ae7a1155c30418bf58e594b9a9b03584e611f' }, h("button", { key: '4ede0a1b0fa118d429c5e84c68077f84bf9d30fa', onClick: () => this.needMore() }, "More"), h("slot-dynamic-scoped-list", { key: '2af6d791b6197761eedc201917d8e4e32ca6ef6f', items: this.items })));
    }
}, [0, "slot-list-light-scoped-root", {
        "items": [1040]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-list-light-scoped-root", "slot-dynamic-scoped-list", "slot-light-scoped-list"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-list-light-scoped-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotListLightScopedRoot$1);
            }
            break;
        case "slot-dynamic-scoped-list":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$3();
            }
            break;
        case "slot-light-scoped-list":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const SlotListLightScopedRoot = SlotListLightScopedRoot$1;
const defineCustomElement = defineCustomElement$1;

export { SlotListLightScopedRoot, defineCustomElement };
