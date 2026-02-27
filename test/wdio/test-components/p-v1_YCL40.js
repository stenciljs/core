import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const MyApp = /*@__PURE__*/ proxyCustomElement(class MyApp extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h(Host, { key: '779a352b3a6c523c3114f95567521974037af749' }, h("div", { key: 'd57c6f94cf30288b840630d436f5953383662031' }, h("slot", { key: '02aedfc92490b2218fd7fef986cfaa4f17cad320' }))));
    }
    static get style() { return `.sc-scoped-ssr-child-cmp-h {
      display: block;
      border: 3px solid red;
    }`; }
}, [262, "scoped-ssr-child-cmp"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["scoped-ssr-child-cmp"];
    components.forEach(tagName => { switch (tagName) {
        case "scoped-ssr-child-cmp":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), MyApp);
            }
            break;
    } });
}

export { MyApp as M, defineCustomElement as d };
