import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const SlotParentTagChange = /*@__PURE__*/ proxyCustomElement(class SlotParentTagChange extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.element = 'p';
    }
    render() {
        return (h(this.element, { key: 'da86cc7d5f7ee8d14ac7f4c731c09ae98ad83890' }, h("slot", { key: '107a92c339f1831b3eafb5c907e17e841fe7d0bc' })));
    }
}, [260, "slot-parent-tag-change", {
        "element": [1]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-parent-tag-change"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-parent-tag-change":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotParentTagChange);
            }
            break;
    } });
}

export { SlotParentTagChange as S, defineCustomElement as d };
