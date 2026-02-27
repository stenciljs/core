import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const ScopedSlotChildInsertAdjacent$1 = /*@__PURE__*/ proxyCustomElement(class ScopedSlotChildInsertAdjacent extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: '1686341d51a08715b775983fa7267d952427bb28', id: "parentDiv", style: { background: 'red' } }, "Here is my slot. It is red.", h("slot", { key: '8d8121705256573fbff71a32b26ba3e499230843' })));
    }
}, [262, "scoped-slot-child-insert-adjacent"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["scoped-slot-child-insert-adjacent"];
    components.forEach(tagName => { switch (tagName) {
        case "scoped-slot-child-insert-adjacent":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ScopedSlotChildInsertAdjacent$1);
            }
            break;
    } });
}

const ScopedSlotChildInsertAdjacent = ScopedSlotChildInsertAdjacent$1;
const defineCustomElement = defineCustomElement$1;

export { ScopedSlotChildInsertAdjacent, defineCustomElement };
