import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-v1_YCL40.js';

const MyApp = /*@__PURE__*/ proxyCustomElement(class MyApp extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return (h(Host, { key: '5f89a1ce61fcac93a830cf9659ed37d95a312c26' }, h("div", { key: '4f8b5d369c4c999f1a4a28b328af01ffdef98406' }, h("scoped-ssr-child-cmp", { key: 'cbbb790e49d91fdce0863bd267970f80aced108a' }, h("slot", { key: '687052cbaa1d065d7e0939ea8d2e9b6c86f1411f', name: "things" })), h("div", { key: '1c7d4ebb5fc068653c93ff5bf3fc838a2ab88ee7' }, h("slot", { key: 'c7a6964b495cfbc15912d641a241b28aac1a5090' })))));
    }
    static get style() { return `:host {
      display: block;
      border: 3px solid blue;
    }`; }
}, [257, "shadow-ssr-parent-cmp"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["shadow-ssr-parent-cmp", "scoped-ssr-child-cmp"];
    components.forEach(tagName => { switch (tagName) {
        case "shadow-ssr-parent-cmp":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), MyApp);
            }
            break;
        case "scoped-ssr-child-cmp":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const ShadowSsrParentCmp = MyApp;
const defineCustomElement = defineCustomElement$1;

export { ShadowSsrParentCmp, defineCustomElement };
