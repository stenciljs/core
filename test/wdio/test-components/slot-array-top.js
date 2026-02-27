import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const SlotArrayTop$1 = /*@__PURE__*/ proxyCustomElement(class SlotArrayTop extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return [h("span", { key: '81b3683c8f596be24c8962e3101cd5dbfeb29141' }, "Content should be on top"), h("slot", { key: 'd1540f44df0286a3e89b3e6826d2ef1737ab4aec' })];
    }
}, [257, "slot-array-top"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-array-top"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-array-top":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotArrayTop$1);
            }
            break;
    } });
}

const SlotArrayTop = SlotArrayTop$1;
const defineCustomElement = defineCustomElement$1;

export { SlotArrayTop, defineCustomElement };
