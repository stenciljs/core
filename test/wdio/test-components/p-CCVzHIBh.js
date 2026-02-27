import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const ShadowDomSlotNested = /*@__PURE__*/ proxyCustomElement(class ShadowDomSlotNested extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return [
            h("header", { key: 'bb319381360d743911d46fbe0e73c27671522745' }, "shadow dom: ", this.i),
            h("footer", { key: 'fdcad31334dcb33ed368b6b6e40644afff4350f1' }, h("slot", { key: '6ab6b70a497164a9cca64a631b4c49b6201ace1a' })),
        ];
    }
    static get style() { return `header {
      color: red;
    }`; }
}, [257, "shadow-dom-slot-nested", {
        "i": [2]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["shadow-dom-slot-nested"];
    components.forEach(tagName => { switch (tagName) {
        case "shadow-dom-slot-nested":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ShadowDomSlotNested);
            }
            break;
    } });
}

export { ShadowDomSlotNested as S, defineCustomElement as d };
