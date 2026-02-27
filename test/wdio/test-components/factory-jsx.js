import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const FactoryJSX = /*@__PURE__*/ proxyCustomElement(class FactoryJSX extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    getJsxNode() {
        return h("div", null, "Factory JSX");
    }
    render() {
        return (h("div", { key: '5544e7f1fa7fc05067abb99f8d518039abe14761' }, this.getJsxNode(), this.getJsxNode()));
    }
}, [0, "factory-jsx"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["factory-jsx"];
    components.forEach(tagName => { switch (tagName) {
        case "factory-jsx":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), FactoryJSX);
            }
            break;
    } });
}

const FactoryJsx = FactoryJSX;
const defineCustomElement = defineCustomElement$1;

export { FactoryJsx, defineCustomElement };
