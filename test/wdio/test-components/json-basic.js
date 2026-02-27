import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const foo = "bar";

const JsonBasic$1 = /*@__PURE__*/ proxyCustomElement(class JsonBasic extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return h("div", { key: '4c4c6c1899c114e6ee475591e4bc9ec7590a323f', id: "json-foo" }, foo);
    }
}, [0, "json-basic"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["json-basic"];
    components.forEach(tagName => { switch (tagName) {
        case "json-basic":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), JsonBasic$1);
            }
            break;
    } });
}

const JsonBasic = JsonBasic$1;
const defineCustomElement = defineCustomElement$1;

export { JsonBasic, defineCustomElement };
