import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const CloneNodeText = /*@__PURE__*/ proxyCustomElement(class CloneNodeText extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h(Host, { key: 'f9186891273f1aa508491aa2e29741e821a40fb0' }, h("p", { key: '8c6b776e5ef405ffb159effccf78416493996fb5', class: "text-content" }, "Clone Node Text")));
    }
}, [0, "clone-node-text"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["clone-node-text"];
    components.forEach(tagName => { switch (tagName) {
        case "clone-node-text":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CloneNodeText);
            }
            break;
    } });
}

export { CloneNodeText as C, defineCustomElement as d };
