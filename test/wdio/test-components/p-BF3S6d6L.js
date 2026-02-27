import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const SlotLightScopedList = /*@__PURE__*/ proxyCustomElement(class SlotLightScopedList extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return [
            h("section", { key: 'f41e007c2d0e1b46d39a2a00ea24fd9cae51b16c' }, "These are my items:"),
            h("article", { key: 'bc92140917187c66bafcd9c68e11a9a13bb7db45', class: "list-wrapper", style: { border: '2px solid green' } }, h("slot", { key: '995f3cf8c5fc93cab9b8b62ec0c73e7bf6f36127' })),
            h("div", { key: '17d57c189f53111e8ae4aa49251fb067a08527ba' }, "That's it...."),
        ];
    }
}, [260, "slot-light-scoped-list"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-light-scoped-list"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-light-scoped-list":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotLightScopedList);
            }
            break;
    } });
}

export { SlotLightScopedList as S, defineCustomElement as d };
