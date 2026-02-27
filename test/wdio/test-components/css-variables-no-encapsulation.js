import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const cmpNoEncapsulationCss = () => `:root{--font-weight:800}.black-local{--background:black;--color:white;background:var(--background);color:var(--color)}.black-global{background:var(--global-background);color:var(--global-color);font-weight:var(--font-weight)}.yellow-global{background:var(--link-background);color:black}`;

const CssVariablesNoEncapsulation$1 = /*@__PURE__*/ proxyCustomElement(class CssVariablesNoEncapsulation extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h(Host, { key: 'ab4a023cb68814d0b3b6fea6b4db0ea66cda1629' }, h("div", { key: 'f04f1a28fc918c052e5caecc24443bc57658e1df', class: "black-local" }, "No encapsulation: Black background"), h("div", { key: 'f1383a881f6e210400726df76caa06b432407f5c', class: "black-global" }, "No encapsulation: Black background (global style)"), h("div", { key: 'bafabe176cd497025feca725509bf951b5e9e434', class: "yellow-global" }, "No encapsulation: Yellow background (global link)")));
    }
    static get style() { return cmpNoEncapsulationCss(); }
}, [0, "css-variables-no-encapsulation"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["css-variables-no-encapsulation"];
    components.forEach(tagName => { switch (tagName) {
        case "css-variables-no-encapsulation":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CssVariablesNoEncapsulation$1);
            }
            break;
    } });
}

const CssVariablesNoEncapsulation = CssVariablesNoEncapsulation$1;
const defineCustomElement = defineCustomElement$1;

export { CssVariablesNoEncapsulation, defineCustomElement };
