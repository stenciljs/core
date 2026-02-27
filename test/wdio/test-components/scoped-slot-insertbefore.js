import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const ScopedSlotInsertBefore = /*@__PURE__*/ proxyCustomElement(class ScopedSlotInsertBefore extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: 'fb4b1dc5ad98e942ddb7f81f446f7515ae8f1956', id: "parentDiv" }, h("div", { key: '2e0e5e094dd78f1ff68608301be770c81a02b217', class: "start-slot", style: { background: 'red' } }, h("div", { key: '96eccb1085c1e4633e0461843a01f317b515368c' }, "Start slot is here:"), h("slot", { key: '707ca1d1a390014d0805a17df541ad0d59817d4e', name: "start-slot" })), h("div", { key: 'b3769f467ab3f0b97fd258b3d188211e2a85a379', class: "default-slot", style: { background: 'green' } }, h("div", { key: '4790ce5d7139f1e2b319a446ec8a8d5054f80d9c' }, "Default slot is here:"), h("slot", { key: '186b746d5079db098b07f8b237734485de58b811' })), h("div", { key: 'f6ab7ea6d40f862ac5524f2ac6120a933c84e59b', class: "end-slot", style: { background: 'blue' } }, h("div", { key: 'a4b554c49988bf6f694c10a747e277c87e482aa7' }, "End slot is here:"), h("slot", { key: 'c187d2435fba5cd698dfa629040f2047e11926c0', name: "end-slot" }))));
    }
}, [262, "scoped-slot-insertbefore"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["scoped-slot-insertbefore"];
    components.forEach(tagName => { switch (tagName) {
        case "scoped-slot-insertbefore":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ScopedSlotInsertBefore);
            }
            break;
    } });
}

const ScopedSlotInsertbefore = ScopedSlotInsertBefore;
const defineCustomElement = defineCustomElement$1;

export { ScopedSlotInsertbefore, defineCustomElement };
