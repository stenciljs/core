import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const SlotDynamicWrapper = /*@__PURE__*/ proxyCustomElement(class SlotDynamicWrapper extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.tag = 'section';
    }
    render() {
        return (h(this.tag, { key: 'f2bf6156ba7f9be2c07b4c4f8edab2cecf608116' }, h("slot", { key: 'e5b4a843ae0a6d9f11c3613219997405c5cb5250' })));
    }
}, [260, "slot-dynamic-wrapper", {
        "tag": [1]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-dynamic-wrapper"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-dynamic-wrapper":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotDynamicWrapper);
            }
            break;
    } });
}

export { SlotDynamicWrapper as S, defineCustomElement as d };
