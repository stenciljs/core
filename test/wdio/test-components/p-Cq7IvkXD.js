import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const ShadowDomBasic = /*@__PURE__*/ proxyCustomElement(class ShadowDomBasic extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return [h("div", { key: '1fe680b567dca670c4b108e54762589d12e63618' }, "shadow"), h("slot", { key: '1dc683d23311ad59516bd8a299168b7112edfc41' })];
    }
    static get style() { return `div {
      background: rgb(0, 0, 0);
      color: white;
    }`; }
}, [257, "shadow-dom-basic"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["shadow-dom-basic"];
    components.forEach(tagName => { switch (tagName) {
        case "shadow-dom-basic":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ShadowDomBasic);
            }
            break;
    } });
}

export { ShadowDomBasic as S, defineCustomElement as d };
