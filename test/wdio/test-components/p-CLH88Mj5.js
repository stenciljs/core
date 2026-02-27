import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const AttributeBasic = /*@__PURE__*/ proxyCustomElement(class AttributeBasic extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.wasClicked = '';
    }
    onClick() {
        this.wasClicked = 'Host event';
    }
    render() {
        return h("span", { key: 'f386b7d01714c20b563cbe5c7b5187e249c62288', id: "result" }, this.wasClicked);
    }
    static get style() { return `.sc-listen-jsx-h {
      background: black;
      display: block;
      color: white;
      width: 100px;
      height: 100px;
    }`; }
}, [2, "listen-jsx", {
        "wasClicked": [32]
    }, [[0, "click", "onClick"]]]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["listen-jsx"];
    components.forEach(tagName => { switch (tagName) {
        case "listen-jsx":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), AttributeBasic);
            }
            break;
    } });
}

export { AttributeBasic as A, defineCustomElement as d };
