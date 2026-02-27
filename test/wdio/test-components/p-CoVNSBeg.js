import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const SlotLightDomContent = /*@__PURE__*/ proxyCustomElement(class SlotLightDomContent extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("header", { key: '8c9785ac3c71e8b3d34211064d21e95577ff42d0' }, h("section", { key: 'ffcfc5af6bd809f02630e6f510d2be51d1504943' }, h("article", { key: 'e5cfb027e5cf1852ab7412a2aa13642cc0d53563' }, h("slot", { key: 'a845a6648d54eddbf418184e5c8a61d36e64d6f3' })))));
    }
}, [260, "slot-light-dom-content"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-light-dom-content"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-light-dom-content":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotLightDomContent);
            }
            break;
    } });
}

export { SlotLightDomContent as S, defineCustomElement as d };
