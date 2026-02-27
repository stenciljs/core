import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-7giYcnpw.js';

const SlotDynamicWrapperRoot$1 = /*@__PURE__*/ proxyCustomElement(class SlotDynamicWrapperRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.tag = 'section';
    }
    changeWrapper() {
        if (this.tag === 'section') {
            this.tag = 'article';
        }
        else {
            this.tag = 'section';
        }
    }
    render() {
        return [
            h("button", { key: '449a1d8d60e86ec658db2179022476ff89c30e85', onClick: this.changeWrapper.bind(this) }, "Change Wrapper"),
            h("slot-dynamic-wrapper", { key: 'b187c95763d6e2a5da82a2d359f907b1a7c6c5c0', tag: this.tag, class: "results1" }, h("h1", { key: '4b91ce05b4972477d8f2a1e1e2466fbdb358bc6f' }, "parent text")),
        ];
    }
}, [0, "slot-dynamic-wrapper-root", {
        "tag": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-dynamic-wrapper-root", "slot-dynamic-wrapper"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-dynamic-wrapper-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotDynamicWrapperRoot$1);
            }
            break;
        case "slot-dynamic-wrapper":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const SlotDynamicWrapperRoot = SlotDynamicWrapperRoot$1;
const defineCustomElement = defineCustomElement$1;

export { SlotDynamicWrapperRoot, defineCustomElement };
