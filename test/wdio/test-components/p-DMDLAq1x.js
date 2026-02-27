import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const SiblingRoot = /*@__PURE__*/ proxyCustomElement(class SiblingRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    componentWillLoad() {
        return new Promise((resolve) => {
            setTimeout(resolve, 50);
        });
    }
    render() {
        return (h("div", { key: '0069475de51f88e1993df373c39d2e15ec558155' }, h("section", { key: '758428fda100dd515c7259b228eb199ff977d3d6' }, "sibling-shadow-dom"), h("article", { key: '2670e1cd0270f0c91416385e4d38fc12844eddaf' }, h("slot", { key: 'b56f8b64d3a10d8a41d9050cf560fc02d1a2365d' }))));
    }
    static get style() { return `.sc-sibling-root-h {
      display: block;
      background: yellow;
      color: maroon;
      margin: 20px;
      padding: 20px;
    }
    section.sc-sibling-root {
      background: blue;
      color: white;
    }
    article.sc-sibling-root {
      background: maroon;
      color: white;
    }`; }
}, [262, "sibling-root"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["sibling-root"];
    components.forEach(tagName => { switch (tagName) {
        case "sibling-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SiblingRoot);
            }
            break;
    } });
}

export { SiblingRoot as S, defineCustomElement as d };
