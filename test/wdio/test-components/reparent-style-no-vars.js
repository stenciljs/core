import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const reparentStyleNoVarsCss = () => `:host{background-color:teal;display:block;padding:2em}.css-entry{color:purple;font-weight:bold}`;

const ReparentStyleNoVars$1 = /*@__PURE__*/ proxyCustomElement(class ReparentStyleNoVars extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return h("div", { key: 'e6cbe7eae378c246f57329f0c98015e26a2b0b0a', class: "css-entry" }, "No CSS Variables");
    }
    static get style() { return reparentStyleNoVarsCss(); }
}, [1, "reparent-style-no-vars"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["reparent-style-no-vars"];
    components.forEach(tagName => { switch (tagName) {
        case "reparent-style-no-vars":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ReparentStyleNoVars$1);
            }
            break;
    } });
}

const ReparentStyleNoVars = ReparentStyleNoVars$1;
const defineCustomElement = defineCustomElement$1;

export { ReparentStyleNoVars, defineCustomElement };
