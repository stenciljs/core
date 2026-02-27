import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-Bxrq_dEd.js';

const MyApp = /*@__PURE__*/ proxyCustomElement(class MyApp extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return (h(Host, { key: '6144da035163f8e37fde44fcf18b779ce7d3ac21' }, h("div", { key: 'e9403b6da1fe141b143d2883eacf424dd299c9c5' }, h("ssr-order-cmp", { key: 'a9e299b421778dce248450fdfdc3d12b6f0751b7' }, h("slot", { key: '9946f8793cb159d75c770b8979778a82d31abfe6', name: "things" }), h("div", { key: '2e31516e71fa29aaa9099fde41b2edd955bf8dc7', class: "AFTER" }, "after")), h("div", { key: '2e9d18feb9ab4a5dbd0618a64a3c8bb96830f53e' }, h("slot", { key: '42dad3aed7a0eff774e6ec587bdcafcbc73944f3' })))));
    }
    static get style() { return `:host {
      display: block;
      border: 3px solid blue;
    }`; }
}, [257, "ssr-order-wrap-cmp"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["ssr-order-wrap-cmp", "ssr-order-cmp"];
    components.forEach(tagName => { switch (tagName) {
        case "ssr-order-wrap-cmp":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), MyApp);
            }
            break;
        case "ssr-order-cmp":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const SsrOrderWrapCmp = MyApp;
const defineCustomElement = defineCustomElement$1;

export { SsrOrderWrapCmp, defineCustomElement };
