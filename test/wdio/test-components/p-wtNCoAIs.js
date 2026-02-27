import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const SlotLightList = /*@__PURE__*/ proxyCustomElement(class SlotLightList extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return [
            h("section", { key: 'e910ddf5f49efd48205975343facb1fe3304181d' }, "These are my items:"),
            h("article", { key: '8e2777409d81d4fe337062c95ca7a8978487c172', class: "list-wrapper", style: { border: '2px solid blue' } }, h("slot", { key: '35ce4968e8db3c97c05dc8bd8f80ac76819f7aef' })),
            h("div", { key: 'b5f384e46c6a2246d58ae7b2141e60385608a8d8' }, "That's it...."),
        ];
    }
}, [260, "slot-light-list"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-light-list"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-light-list":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotLightList);
            }
            break;
    } });
}

export { SlotLightList as S, defineCustomElement as d };
