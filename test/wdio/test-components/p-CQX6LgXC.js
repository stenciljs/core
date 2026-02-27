import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const SsrShadowCmp = /*@__PURE__*/ proxyCustomElement(class SsrShadowCmp extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return (h("div", { key: 'fa9009b1d2ce631b2c01f7fc287a783e30f908e8', class: {
                selected: this.selected,
            }, part: "container" }, h("slot", { key: '7df2dfc26f352a8448631d349f583618c2dfbbce', name: "top" }), h("slot", { key: '1eea0686f48408e651404512d2a09a345ab19a76' }), h("slot", { key: '53a9517c83c3b02c4ee1bdfbbd85ea9c794de0f5', name: "client-only" })));
    }
    static get style() { return `:host {
      display: block;
      padding: 10px;
      border: 2px solid #000;
      background: yellow;
      color: red;
    }`; }
}, [257, "part-ssr-shadow-cmp", {
        "selected": [4]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["part-ssr-shadow-cmp"];
    components.forEach(tagName => { switch (tagName) {
        case "part-ssr-shadow-cmp":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SsrShadowCmp);
            }
            break;
    } });
}

export { SsrShadowCmp as S, defineCustomElement as d };
