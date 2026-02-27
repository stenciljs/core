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
        return (h("div", { key: '6949bcbc1b0f9b4c49b4049a79f54f626961105f', class: {
                selected: this.selected,
            } }, h("slot", { key: '9836d2ebaf272733bbce1ca6ac450dbce8488864', name: "top" }), h("slot", { key: '10f573db39c807bd721a059844c4aa1427bc62ff' }), h("slot", { key: 'db629ae5ef9998ff07e5125565fb9ce518527ba0', name: "client-only" })));
    }
    static get style() { return `:host {
      display: block;
      padding: 10px;
      border: 2px solid #000;
      background: yellow;
      color: red;
    }`; }
}, [257, "ssr-shadow-cmp", {
        "selected": [4]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["ssr-shadow-cmp"];
    components.forEach(tagName => { switch (tagName) {
        case "ssr-shadow-cmp":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SsrShadowCmp);
            }
            break;
    } });
}

export { SsrShadowCmp as S, defineCustomElement as d };
