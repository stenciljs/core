import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const barCss = () => `:host{display:block;font-style:italic}h1{color:blue}p{color:blue}`;

const fooCss = () => `:host{display:block}h1{color:red}p{color:red}`;

const SassCmp = /*@__PURE__*/ proxyCustomElement(class SassCmp extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return (h("main", { key: 'cdf08828c59631563284abe0b737a72fd80cd1a4' }, h("h1", { key: '157595d8c4d5581dee1dd39275c2bb21f5a05eda' }, "Hello World"), h("p", { key: '90e78ac02108a3fc80413491a5bd0f2fc110cc5e' }, "What's your name?")));
    }
    static get style() { return barCss() + fooCss(); }
}, [1, "multiple-styles-cmp"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["multiple-styles-cmp"];
    components.forEach(tagName => { switch (tagName) {
        case "multiple-styles-cmp":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SassCmp);
            }
            break;
    } });
}

const MultipleStylesCmp = SassCmp;
const defineCustomElement = defineCustomElement$1;

export { MultipleStylesCmp, defineCustomElement };
