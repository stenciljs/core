import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const MyApp = /*@__PURE__*/ proxyCustomElement(class MyApp extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
        this.anArray = [];
    }
    render() {
        return (h(Host, { key: '5753875d754d5a3db465f198ccd36664271de2de' }, h("div", { key: '384f116c7d5348d9176204ad8d8050f0012c330b' }, "An array component:", h("ol", { key: '45385c615d0ec35ce6233f44a3db982d605ed679' }, this.anArray.map((item) => (h("li", null, item)))))));
    }
    static get style() { return `:host {
      display: block;
    }`; }
}, [1, "slow-ssr-prop", {
        "anArray": [16]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slow-ssr-prop"];
    components.forEach(tagName => { switch (tagName) {
        case "slow-ssr-prop":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), MyApp);
            }
            break;
    } });
}

const SlowSsrProp = MyApp;
const defineCustomElement = defineCustomElement$1;

export { SlowSsrProp, defineCustomElement };
