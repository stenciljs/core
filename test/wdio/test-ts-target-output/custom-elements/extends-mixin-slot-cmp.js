import { h, p as proxyCustomElement, M as Mixin, t as transformTag } from './index.js';

/**
 * A mixin that provides a renderContent method containing a slot.
 * This tests that Stencil properly walks into mixin factory functions
 * to detect slot elements for build conditionals.
 */
const SlotMixinFactory = (Base) => {
    const SlotMixin = class extends Base {
        constructor() {
            super(false);
        }
        renderContent = () => (h("div", { class: "mixin-wrapper" }, h("div", { class: "mixin-header" }, "Mixin Content Header"), h("slot", { name: "content" }), h("div", { class: "mixin-footer" }, "Mixin Content Footer")));
    };
    return SlotMixin;
};

const MixinSlotCmp = /*@__PURE__*/ proxyCustomElement(class MixinSlotCmp extends Mixin(SlotMixinFactory) {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: '7e8668b74aa88fd566110d31918c65f307e270dc', class: "component-root" }, h("h2", { key: '97b8bf4f37e329dc6eb943e0931c5db6fefd23fa', class: "component-title" }, "Mixin Slot Test Component"), this.renderContent()));
    }
}, [512, "extends-mixin-slot-cmp"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["extends-mixin-slot-cmp"];
    components.forEach(tagName => { switch (tagName) {
        case "extends-mixin-slot-cmp":
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), MixinSlotCmp);
            }
            break;
    } });
}
defineCustomElement$1();

const ExtendsMixinSlotCmp = MixinSlotCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsMixinSlotCmp, defineCustomElement };
//# sourceMappingURL=extends-mixin-slot-cmp.js.map

//# sourceMappingURL=extends-mixin-slot-cmp.js.map