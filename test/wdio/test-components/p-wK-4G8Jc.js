import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$1 } from './p-C3KP0tP6.js';

const SlotNestedDynamicChild = /*@__PURE__*/ proxyCustomElement(class SlotNestedDynamicChild extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h(Host, { key: 'c277fb7115da840351398a66f0fe98fd37482518' }, h("slot-nested-dynamic-wrapper", { key: 'a4de6b1afe48ef53542190e8c722eda7c15e37ab', id: "banner" }, "Banner notification"), h("slot", { key: 'ef9bb207cf9c81f0db7bba7c45c59a930106e6c2', name: "header" }), h("slot-nested-dynamic-wrapper", { key: 'f81ba5face4fa95d24e968b104129f5428d4f62a', id: "level-1" }, h("slot-nested-dynamic-wrapper", { key: '01fcba84b3b2c1747e5a6b4cc018f6a96404dcaa', id: "level-2" }, h("slot", { key: 'f1684fb5f45542fd4612d42e03aff44093b72a65' })))));
    }
}, [262, "slot-nested-dynamic-child"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-nested-dynamic-child", "slot-nested-dynamic-wrapper"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-nested-dynamic-child":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotNestedDynamicChild);
            }
            break;
        case "slot-nested-dynamic-wrapper":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$1();
            }
            break;
    } });
}

export { SlotNestedDynamicChild as S, defineCustomElement as d };
