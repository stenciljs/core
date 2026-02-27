import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const SlotHideContentScoped$1 = /*@__PURE__*/ proxyCustomElement(class SlotHideContentScoped extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.enabled = false;
    }
    render() {
        return (h(Host, { key: '091668e210a9824f57da6b846e682bf6bc527cca' }, h("p", { key: 'db62d41c71c73537d9f90c35029e9c1346cb8508' }, "Test"), this.enabled && (h("div", { key: '516a9705f0ebcf5e6b4aa85ad7fea3c86075f982', class: "slot-wrapper" }, h("slot", { key: 'd473f166158e0dcd12ee21dc209ed33889f86e35' }, h("span", { key: '5a11e315d194b7540f48b266abf3e6ab6adaa116' }, "fallback default slot"))))));
    }
}, [262, "slot-hide-content-scoped", {
        "enabled": [4]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-hide-content-scoped"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-hide-content-scoped":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotHideContentScoped$1);
            }
            break;
    } });
}

const SlotHideContentScoped = SlotHideContentScoped$1;
const defineCustomElement = defineCustomElement$1;

export { SlotHideContentScoped, defineCustomElement };
