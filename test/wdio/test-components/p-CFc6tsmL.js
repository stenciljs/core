import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$1 } from './p-BF3S6d6L.js';

const DynamicListScopedComponent = /*@__PURE__*/ proxyCustomElement(class DynamicListScopedComponent extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.items = [];
    }
    render() {
        return (h("slot-light-scoped-list", { key: '3411af95b0a678f7734eaf68c0a057e901d254c8' }, this.items.map((item) => (h("div", null, item)))));
    }
}, [2, "slot-dynamic-scoped-list", {
        "items": [16]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-dynamic-scoped-list", "slot-light-scoped-list"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-dynamic-scoped-list":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), DynamicListScopedComponent);
            }
            break;
        case "slot-light-scoped-list":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$1();
            }
            break;
    } });
}

export { DynamicListScopedComponent as D, defineCustomElement as d };
