import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const SlotNestedDynamicWrapper = /*@__PURE__*/ proxyCustomElement(class SlotNestedDynamicWrapper extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h(Host, { key: 'b59de82c443ac05ae1fd19ff1583511ff604f7e9' }, h("slot", { key: '13a821964e7589b2eb5e64ce0b6ae99a15d4ab3f' })));
    }
}, [262, "slot-nested-dynamic-wrapper"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-nested-dynamic-wrapper"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-nested-dynamic-wrapper":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotNestedDynamicWrapper);
            }
            break;
    } });
}

export { SlotNestedDynamicWrapper as S, defineCustomElement as d };
