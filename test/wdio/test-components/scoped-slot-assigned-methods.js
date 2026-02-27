import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const ScopedSlotAssignedMethods$1 = /*@__PURE__*/ proxyCustomElement(class ScopedSlotAssignedMethods extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    async getSlotAssignedElements(opts, getPlainSlot = false) {
        if (getPlainSlot) {
            return this.plainSlot.assignedElements(opts);
        }
        return this.fbSlot.assignedElements(opts);
    }
    async getSlotAssignedNodes(opts, getPlainSlot = false) {
        if (getPlainSlot) {
            return this.plainSlot.assignedNodes(opts);
        }
        return this.fbSlot.assignedNodes(opts);
    }
    render() {
        return (h("div", { key: 'ba6f376c0614813f0296a15f7419443b255581dc' }, h("slot", { key: '3c6056e813cf1ca1d38072b7ab556da22d42477f', ref: (slot) => {
                this.fbSlot = slot;
            } }, h("slot", { key: 'c601a9475cf6bcd72029d20a7ca283bbe2cfa541', name: "nested-slot" }, "Fallback content")), h("slot", { key: '61b0afd8aa8f75778ed6c838e9bd655c9c079449', name: "plain-slot", ref: (s) => (this.plainSlot = s) })));
    }
}, [262, "scoped-slot-assigned-methods", {
        "getSlotAssignedElements": [64],
        "getSlotAssignedNodes": [64]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["scoped-slot-assigned-methods"];
    components.forEach(tagName => { switch (tagName) {
        case "scoped-slot-assigned-methods":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ScopedSlotAssignedMethods$1);
            }
            break;
    } });
}

const ScopedSlotAssignedMethods = ScopedSlotAssignedMethods$1;
const defineCustomElement = defineCustomElement$1;

export { ScopedSlotAssignedMethods, defineCustomElement };
