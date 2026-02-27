import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$1 } from './p-wtNCoAIs.js';

const DynamicListShadowComponent = /*@__PURE__*/ proxyCustomElement(class DynamicListShadowComponent extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
        this.items = [];
    }
    render() {
        return (h("slot-light-list", { key: 'eaaa66cf6299bd9dbbdfb30e4956f602ac626c96' }, this.items.map((item) => (h("div", null, item)))));
    }
}, [1, "slot-dynamic-shadow-list", {
        "items": [16]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-dynamic-shadow-list", "slot-light-list"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-dynamic-shadow-list":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), DynamicListShadowComponent);
            }
            break;
        case "slot-light-list":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$1();
            }
            break;
    } });
}

export { DynamicListShadowComponent as D, defineCustomElement as d };
