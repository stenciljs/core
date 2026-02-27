import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const MyApp = /*@__PURE__*/ proxyCustomElement(class MyApp extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return (h(Host, { key: 'b1c86300c4dbec418a6a55fa11d5e9df3940a62c' }, "Order component. Shadow.", h("slot", { key: '57ec721121ff76155e435ca2888f88cad4b815d2' })));
    }
    static get style() { return `:host {
      display: block;
      border: 3px solid red;
    }`; }
}, [257, "ssr-order-cmp"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["ssr-order-cmp"];
    components.forEach(tagName => { switch (tagName) {
        case "ssr-order-cmp":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), MyApp);
            }
            break;
    } });
}

export { MyApp as M, defineCustomElement as d };
