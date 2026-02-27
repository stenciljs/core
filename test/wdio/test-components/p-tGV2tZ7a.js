import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const SlotNestedOrderChild = /*@__PURE__*/ proxyCustomElement(class SlotNestedOrderChild extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h(Host, { key: 'ebfec24166cb36f624302ea68aee1d489d70166f' }, h("cmp-3", { key: '2484f48ace3396cf4dff0afae2e106cd9bf96608' }, "3"), h("i", { key: '46e968448db690d26c74a7949981d7a72586e4cc' }, h("slot", { key: '9f785a07e05b694bb62b3f75896bd4b590a5028d' })), h("cmp-5", { key: '347e8b643cba598e0aac7474f9e9fcd5ddea3a4f' }, "5"), h("slot", { key: '079c8d07dee52e0cd68bbad418458b18673ad56f', name: "end-slot-name" })));
    }
}, [260, "slot-nested-order-child"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-nested-order-child"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-nested-order-child":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotNestedOrderChild);
            }
            break;
    } });
}

export { SlotNestedOrderChild as S, defineCustomElement as d };
