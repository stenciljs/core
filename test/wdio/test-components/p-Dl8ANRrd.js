import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const cmpScopedBCss = () => `.sc-cmp-scoped-b-h{display:block;background-color:rgb(128, 128, 128)}div.sc-cmp-scoped-b{font-size:18px}p.sc-cmp-scoped-b{color:rgb(0, 128, 0)}.scoped-class.sc-cmp-scoped-b{color:rgb(255, 255, 0)}.i-am-an-unused-selecor.sc-cmp-scoped-b{color:rgb(255, 0, 0)}`;

const CmpScopedB = /*@__PURE__*/ proxyCustomElement(class CmpScopedB extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: 'e58388854d419ff79d83ccb37aee0534ccc4428b' }, h("p", { key: '77f864f27c15dac92a48b0f5a564df784b79df45' }, "cmp-scoped-b"), h("p", { key: '131dc19f38051eba4e79f9c506037889f8cd1ce6', class: "scoped-class" }, "scoped-class")));
    }
    static get style() { return cmpScopedBCss(); }
}, [2, "cmp-scoped-b"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["cmp-scoped-b"];
    components.forEach(tagName => { switch (tagName) {
        case "cmp-scoped-b":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CmpScopedB);
            }
            break;
    } });
}

export { CmpScopedB as C, defineCustomElement as d };
