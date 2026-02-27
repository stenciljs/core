import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const cmpShadowDomCss = () => `:host{--color:blue;--background:red}:host(.set-green){--background:green}.inner-div{background:var(--background);color:var(--color)}.black-global-shadow{background:var(--global-background);color:var(--global-color);font-weight:var(--font-weight)}`;

const CssVariablesRoot = /*@__PURE__*/ proxyCustomElement(class CssVariablesRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
        this.isGreen = false;
    }
    render() {
        return (h(Host, { key: 'cd1d18baa963dfa160efa0011e0c68fd6be1f94f', class: {
                'set-green': this.isGreen,
            } }, h("div", { key: 'c1ce39d97c28175bb1c659dc4be9c3015079df60', class: "inner-div" }, "Shadow: ", this.isGreen ? 'Green' : 'Red', " background"), h("div", { key: '6c7627d77c94c250c9a925e6cd608def10da708d', class: "black-global-shadow" }, "Shadow: Black background (global)"), h("button", { key: 'a9547896fbcaf27e9c268104a7299d66d3ffdbdb', onClick: () => {
                this.isGreen = !this.isGreen;
            } }, "Toggle color")));
    }
    static get style() { return cmpShadowDomCss(); }
}, [1, "css-variables-shadow-dom", {
        "isGreen": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["css-variables-shadow-dom"];
    components.forEach(tagName => { switch (tagName) {
        case "css-variables-shadow-dom":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CssVariablesRoot);
            }
            break;
    } });
}

const CssVariablesShadowDom = CssVariablesRoot;
const defineCustomElement = defineCustomElement$1;

export { CssVariablesShadowDom, defineCustomElement };
