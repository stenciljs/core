import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const ScopedSlotInsertionOrderAfterInteraction$1 = /*@__PURE__*/ proxyCustomElement(class ScopedSlotInsertionOrderAfterInteraction extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.totalCounter = 0;
    }
    render() {
        return (h(Host, { key: '19b2fef041c53b89ffb2bf452a82251bdfda20db', "data-counter": this.totalCounter, onClick: () => {
                this.totalCounter = this.totalCounter + 1;
            } }, h("slot", { key: '513e97470ac210854aeb0e7841dd54695de9adef' })));
    }
}, [262, "scoped-slot-insertion-order-after-interaction", {
        "totalCounter": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["scoped-slot-insertion-order-after-interaction"];
    components.forEach(tagName => { switch (tagName) {
        case "scoped-slot-insertion-order-after-interaction":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ScopedSlotInsertionOrderAfterInteraction$1);
            }
            break;
    } });
}

const ScopedSlotInsertionOrderAfterInteraction = ScopedSlotInsertionOrderAfterInteraction$1;
const defineCustomElement = defineCustomElement$1;

export { ScopedSlotInsertionOrderAfterInteraction, defineCustomElement };
