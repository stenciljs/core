import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const RefAttrOrder$1 = /*@__PURE__*/ proxyCustomElement(class RefAttrOrder extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
        this.index = -1;
    }
    // order matters for the attributes in the test below!
    //
    // this is testing that even though the `ref` attribute is declared first in
    // the JSX for the `div` the `ref` callback will nonetheless be called after
    // the `tabIndex` attribute is applied to the element.
    // See https://github.com/stenciljs/core/issues/4074
    render() {
        return (h("div", { key: '9580a623f26ecef1e75a4a9b7381d75dd3604e5b', ref: (el) => {
                if (el) {
                    this.index = el.tabIndex;
                }
            }, tabIndex: 0 }, "my tabIndex: ", this.index));
    }
}, [1, "ref-attr-order", {
        "index": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["ref-attr-order"];
    components.forEach(tagName => { switch (tagName) {
        case "ref-attr-order":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), RefAttrOrder$1);
            }
            break;
    } });
}

const RefAttrOrder = RefAttrOrder$1;
const defineCustomElement = defineCustomElement$1;

export { RefAttrOrder, defineCustomElement };
