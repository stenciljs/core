import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-D3l-k8mT.js';

const CustomElementRoot = /*@__PURE__*/ proxyCustomElement(class CustomElementRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return (h("div", { key: '004ddf7b6bde182ba6d01b2a8f21032f02e3688c' }, h("h2", { key: '784fd4b347ceb21fbca9847d04439d2f562b1bf9' }, "Root Element Loaded"), h("custom-element-child-different-name-than-class", { key: '47aec5cec79d5253096c9435bcd16714bba88291' })));
    }
}, [1, "custom-element-root-different-name-than-class"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["custom-element-root-different-name-than-class", "custom-element-child-different-name-than-class"];
    components.forEach(tagName => { switch (tagName) {
        case "custom-element-root-different-name-than-class":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CustomElementRoot);
            }
            break;
        case "custom-element-child-different-name-than-class":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const CustomElementRootDifferentNameThanClass = CustomElementRoot;
const defineCustomElement = defineCustomElement$1;

export { CustomElementRootDifferentNameThanClass, defineCustomElement };
