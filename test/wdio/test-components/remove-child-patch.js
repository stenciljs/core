import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const RemoveChildPatch$1 = /*@__PURE__*/ proxyCustomElement(class RemoveChildPatch extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: '6a4f947ca23b9f80b7cfa0b3626e74f29ef20e52' }, h("p", { key: '132f12a1a8147cad4b944db6810d6088f235e2cc' }, "I'm not in a slot"), h("div", { key: '2f594b699953dab422287524bb93f3c8961958a1', class: "slot-container" }, h("slot", { key: '9ebbf4f718884646d7890a0a223500d1b401cb81' }, "Slot fallback content"))));
    }
}, [262, "remove-child-patch"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["remove-child-patch"];
    components.forEach(tagName => { switch (tagName) {
        case "remove-child-patch":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), RemoveChildPatch$1);
            }
            break;
    } });
}

const RemoveChildPatch = RemoveChildPatch$1;
const defineCustomElement = defineCustomElement$1;

export { RemoveChildPatch, defineCustomElement };
