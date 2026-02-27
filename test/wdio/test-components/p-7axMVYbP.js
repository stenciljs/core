import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const CloneNodeSlide = /*@__PURE__*/ proxyCustomElement(class CloneNodeSlide extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h(Host, { key: '06ef9e2446ff835b670dd15d54d959e6207a49b0' }, h("p", { key: 'e180528e1ca7b8cb5fa8600ff2ab1843fe0287e3', class: "slide-content" }, "Slide Content"), h("slot", { key: 'cc8728c16e36a8b534f4b6a3de6b6f4c8308e77f' })));
    }
}, [260, "clone-node-slide"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["clone-node-slide"];
    components.forEach(tagName => { switch (tagName) {
        case "clone-node-slide":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CloneNodeSlide);
            }
            break;
    } });
}

export { CloneNodeSlide as C, defineCustomElement as d };
