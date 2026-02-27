import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const reparentStyleWithVarsCss = () => `:root{--custom-color:blue}:host{background-color:var(--custom-color, blue);display:block;padding:2em}.css-entry{color:purple;font-weight:bold}`;

const ReparentStyleWithVars$1 = /*@__PURE__*/ proxyCustomElement(class ReparentStyleWithVars extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return h("div", { key: 'f9b32bd0b18c57ae00427580a08ff6cad6dc1aa8', class: "css-entry" }, "With CSS Vars");
    }
    static get style() { return reparentStyleWithVarsCss(); }
}, [1, "reparent-style-with-vars"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["reparent-style-with-vars"];
    components.forEach(tagName => { switch (tagName) {
        case "reparent-style-with-vars":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ReparentStyleWithVars$1);
            }
            break;
    } });
}

const ReparentStyleWithVars = ReparentStyleWithVars$1;
const defineCustomElement = defineCustomElement$1;

export { ReparentStyleWithVars, defineCustomElement };
