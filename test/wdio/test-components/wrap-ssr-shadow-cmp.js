import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-DRvzOStq.js';

const SsrWrapShadowCmp = /*@__PURE__*/ proxyCustomElement(class SsrWrapShadowCmp extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return (h("div", { key: '2111a4acb62d368a14aa70309a421476cc821912', class: {
                selected: this.selected,
            } }, "Nested component:", h("ssr-shadow-cmp", { key: 'fbac344b882fcd726a153bfdd5b83da0add397bd' }, h("slot", { key: '4deb9a2331f965791d35409c2b98b9052bdb23aa' }))));
    }
    static get style() { return `:host {
      display: block;
      padding: 10px;
      border: 2px solid #000;
      background: blue;
      color: white;
    }`; }
}, [257, "wrap-ssr-shadow-cmp", {
        "selected": [4]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["wrap-ssr-shadow-cmp", "ssr-shadow-cmp"];
    components.forEach(tagName => { switch (tagName) {
        case "wrap-ssr-shadow-cmp":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SsrWrapShadowCmp);
            }
            break;
        case "ssr-shadow-cmp":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const WrapSsrShadowCmp = SsrWrapShadowCmp;
const defineCustomElement = defineCustomElement$1;

export { WrapSsrShadowCmp, defineCustomElement };
