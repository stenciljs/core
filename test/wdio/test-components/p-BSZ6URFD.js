import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const ScopedSlotChange = /*@__PURE__*/ proxyCustomElement(class ScopedSlotChange extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.slotEventCatch = [];
        this.handleSlotchange = (e) => {
            this.slotEventCatch.push({
                event: e,
                assignedNodes: e.target.assignedNodes(),
            });
        };
    }
    render() {
        return (h("div", { key: 'dc8bd4a0d52726b0ae8015627d5d3b4a383fc1ca' }, h("slot", { key: '204f412842ed86dc274afa96840cbcbfcdf74eab', onSlotchange: this.handleSlotchange }), h("slot", { key: 'a5de5989a009f4ec49df9ab3ad0bfbf1e85e2bbd', name: "fallback-slot", onSlotchange: this.handleSlotchange }, "Slot with fallback")));
    }
}, [262, "scoped-slot-slotchange", {
        "slotEventCatch": [1040]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["scoped-slot-slotchange"];
    components.forEach(tagName => { switch (tagName) {
        case "scoped-slot-slotchange":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ScopedSlotChange);
            }
            break;
    } });
}

export { ScopedSlotChange as S, defineCustomElement as d };
