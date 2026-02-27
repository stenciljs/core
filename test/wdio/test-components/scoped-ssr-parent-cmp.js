import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$3 } from './p-CjQcQ0_O.js';
import { d as defineCustomElement$2 } from './p-Bxrq_dEd.js';

const MyApp = /*@__PURE__*/ proxyCustomElement(class MyApp extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h(Host, { key: 'f8f96e7f52863764b12967f7bf66df126893c1a2' }, h("div", { key: '71398f8830ab50d8e946ea5390de0e6f6aeb6e37' }, "Scoped parent with named slot.", h("shadow-ssr-child-cmp", { key: '9ff8f8fdd6e8a682952981b53ccdb774a96e1cf6' }, h("slot", { key: '9c4b4766e5743112c65b6f2f885449f8159ff8dd' }), h("slot", { key: '2752a35f843baaf60c095e50840d598f900bbc93', name: "things" })))));
    }
    static get style() { return `.sc-scoped-ssr-parent-cmp-h {
      display: block;
      border: 3px solid blue;
    }`; }
}, [262, "scoped-ssr-parent-cmp"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["scoped-ssr-parent-cmp", "shadow-ssr-child-cmp", "ssr-order-cmp"];
    components.forEach(tagName => { switch (tagName) {
        case "scoped-ssr-parent-cmp":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), MyApp);
            }
            break;
        case "shadow-ssr-child-cmp":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$3();
            }
            break;
        case "ssr-order-cmp":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const ScopedSsrParentCmp = MyApp;
const defineCustomElement = defineCustomElement$1;

export { ScopedSsrParentCmp, defineCustomElement };
