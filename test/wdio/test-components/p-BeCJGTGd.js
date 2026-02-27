import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const cmpScopedACss = () => `.sc-cmp-scoped-a-h{display:block;background-color:rgb(0, 128, 0)}div.sc-cmp-scoped-a{font-size:14px}p.sc-cmp-scoped-a{color:rgb(128, 0, 128)}.scoped-class.sc-cmp-scoped-a{color:rgb(0, 0, 255)}.i-am-an-unused-selecor.sc-cmp-scoped-a{color:rgb(255, 0, 0)}`;

const CmpScopedA = /*@__PURE__*/ proxyCustomElement(class CmpScopedA extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: '7f2613504c41f3fa8ef0abc8f9205f063fdda3ed' }, h("p", { key: '1cc320ca016fac361264ee18dadf973489c0d0f2' }, "cmp-scoped-a"), h("p", { key: '87f28c3a00d6d55e6e676c35c3aba6e1cb518cad', class: "scoped-class" }, "scoped-class")));
    }
    static get style() { return cmpScopedACss(); }
}, [2, "cmp-scoped-a"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["cmp-scoped-a"];
    components.forEach(tagName => { switch (tagName) {
        case "cmp-scoped-a":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CmpScopedA);
            }
            break;
    } });
}

export { CmpScopedA as C, defineCustomElement as d };
