import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const SlotReorder = /*@__PURE__*/ proxyCustomElement(class SlotReorder extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.reordered = false;
    }
    render() {
        if (this.reordered) {
            return (h("div", { class: "reordered" }, h("slot", { name: "slot-b" }, h("div", null, "fallback slot-b")), h("slot", null, h("div", null, "fallback default")), h("slot", { name: "slot-a" }, h("div", null, "fallback slot-a"))));
        }
        return (h("div", null, h("slot", null, h("div", null, "fallback default")), h("slot", { name: "slot-a" }, h("div", null, "fallback slot-a")), h("slot", { name: "slot-b" }, h("div", null, "fallback slot-b"))));
    }
}, [260, "slot-reorder", {
        "reordered": [4]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-reorder"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-reorder":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotReorder);
            }
            break;
    } });
}

export { SlotReorder as S, defineCustomElement as d };
