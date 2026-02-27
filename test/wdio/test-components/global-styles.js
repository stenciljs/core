import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const GlobalStyles$1 = /*@__PURE__*/ proxyCustomElement(class GlobalStyles extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return h(Host, { key: '5fdcce6048b166ce0dd35fb5f95353c5adc791d8' }, "Hello World");
    }
}, [1, "global-styles"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["global-styles"];
    components.forEach(tagName => { switch (tagName) {
        case "global-styles":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), GlobalStyles$1);
            }
            break;
    } });
}

const GlobalStyles = GlobalStyles$1;
const defineCustomElement = defineCustomElement$1;

export { GlobalStyles, defineCustomElement };
