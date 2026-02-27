import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$1 } from './p-Bxrq_dEd.js';

const MyApp = /*@__PURE__*/ proxyCustomElement(class MyApp extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return (h(Host, { key: '0f409e627fc0e2a658c109d77972d662fda2bca6' }, h("div", { key: '796eedca1ce615569c0130c1a9ff6af1093e74c4' }, "Shadow Child 1.", h("ssr-order-cmp", { key: 'b8f8400fb8aecdc34abe05c2e119cde40a1906ff' }, h("slot", { key: '8dde6c031778d6166b6c328fe643bfbebcd9037c' })))));
    }
    static get style() { return `:host {
      display: block;
      border: 3px solid red;
    }`; }
}, [257, "shadow-ssr-child-cmp"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["shadow-ssr-child-cmp", "ssr-order-cmp"];
    components.forEach(tagName => { switch (tagName) {
        case "shadow-ssr-child-cmp":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), MyApp);
            }
            break;
        case "ssr-order-cmp":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$1();
            }
            break;
    } });
}

export { MyApp as M, defineCustomElement as d };
