import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const cmpCss = () => `:root{--font-color:blue}header{color:var(--font-color)}`;

const DynamicCssVariables = /*@__PURE__*/ proxyCustomElement(class DynamicCssVariables extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.bgColor = 'white';
    }
    getBackgroundStyle() {
        return this.bgColor && this.bgColor !== 'white' ? { background: this.bgColor, '--font-color': 'white' } : {};
    }
    changeColor() {
        if (this.bgColor === 'white') {
            this.bgColor = 'red';
        }
        else {
            this.bgColor = 'white';
        }
    }
    render() {
        return [
            h("header", { key: 'e06807cd70f023974c0d8d950f7ee509496a5e61', style: this.getBackgroundStyle() }, "Dynamic CSS Variables!!"),
            h("main", { key: 'be24c9d01df6348a1d91b4e6c502d0657d2963cd' }, h("p", { key: 'af6a005e28852a138f8fe0e2786962968cdeca57' }, h("button", { key: '727d2d7534540eef5e5085a999829454e582d7b4', onClick: this.changeColor.bind(this) }, "Change Color"))),
        ];
    }
    static get style() { return cmpCss(); }
}, [0, "dynamic-css-variable", {
        "bgColor": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["dynamic-css-variable"];
    components.forEach(tagName => { switch (tagName) {
        case "dynamic-css-variable":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), DynamicCssVariables);
            }
            break;
    } });
}

const DynamicCssVariable = DynamicCssVariables;
const defineCustomElement = defineCustomElement$1;

export { DynamicCssVariable, defineCustomElement };
