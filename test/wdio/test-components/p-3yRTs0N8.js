import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const SlotArrayComplex = /*@__PURE__*/ proxyCustomElement(class SlotArrayComplex extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return [
            h("slot", { key: 'cb46232b19e57d4376df7b297fd95ce37c90c38c', name: "start" }),
            h("section", { key: '921ca40724cefb0f64c9594bbdcbf965b3e07ba0' }, h("slot", { key: '1e5f58abde2db1cd0c797e64bc473446f93f39e5' })),
            h("slot", { key: 'af24285cbb8ef8c1301ec21d404d876953c18d1e', name: "end" }),
        ];
    }
}, [260, "slot-array-complex"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-array-complex"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-array-complex":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotArrayComplex);
            }
            break;
    } });
}

export { SlotArrayComplex as S, defineCustomElement as d };
