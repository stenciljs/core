import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const cmpCss = () => `header{background:yellow;padding:10px}footer{background:limegreen;padding:10px}`;

const SlotArrayBasic$1 = /*@__PURE__*/ proxyCustomElement(class SlotArrayBasic extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return [h("header", { key: '4c876ce7fffa14452a0b0376f5259cac12e6b98d' }, "Header"), h("slot", { key: '5f259fb9c6297d32985f17d86995f75182f5efa0' }), h("footer", { key: '5a3219213dd7629891d89e95d2d98e9f4545b6e7' }, "Footer")];
    }
    static get style() { return cmpCss(); }
}, [260, "slot-array-basic"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-array-basic"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-array-basic":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotArrayBasic$1);
            }
            break;
    } });
}

const SlotArrayBasic = SlotArrayBasic$1;
const defineCustomElement = defineCustomElement$1;

export { SlotArrayBasic, defineCustomElement };
