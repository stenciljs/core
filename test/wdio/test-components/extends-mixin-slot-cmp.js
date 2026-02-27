import { h, p as proxyCustomElement, M as Mixin, t as transformTag } from './p-DYdAJnXF.js';

/**
 * A mixin that provides a renderContent method containing a slot.
 * This tests that Stencil properly walks into mixin factory functions
 * to detect slot elements for build conditionals.
 */
const SlotMixinFactory = (Base) => {
    const SlotMixin = class extends Base {
        constructor() {
            super(...arguments);
            this.renderContent = () => (h("div", { class: "mixin-wrapper" }, h("div", { class: "mixin-header" }, "Mixin Content Header"), h("slot", { name: "content" }), h("div", { class: "mixin-footer" }, "Mixin Content Footer")));
        }
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
        return (h("div", { key: 'aa515b5c43ae9193c53baf805816b6be883a4345', class: "component-root" }, h("h2", { key: '3335124b53c7aa69d29fb5d1af03413bd024b532', class: "component-title" }, "Mixin Slot Test Component"), this.renderContent()));
    }
}, [512, "extends-mixin-slot-cmp"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["extends-mixin-slot-cmp"];
    components.forEach(tagName => { switch (tagName) {
        case "extends-mixin-slot-cmp":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), MixinSlotCmp);
            }
            break;
    } });
}

const ExtendsMixinSlotCmp = MixinSlotCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsMixinSlotCmp, defineCustomElement };
