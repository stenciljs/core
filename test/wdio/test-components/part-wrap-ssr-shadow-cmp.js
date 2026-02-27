import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-CQX6LgXC.js';

const SsrWrapShadowCmp = /*@__PURE__*/ proxyCustomElement(class SsrWrapShadowCmp extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return (h("div", { key: '199e1659c84948b64ccd41fb51097b8bceda9596', class: {
                selected: this.selected,
            } }, "Nested component:", h("part-ssr-shadow-cmp", { key: '4c3e1cb4453b110ce559eb5136e72dbb18bba8da' }, h("slot", { key: '65c327b54f696df65f038952d6842ac6f73a9679' }))));
    }
    static get style() { return `:host {
      display: block;
      padding: 10px;
      border: 2px solid #000;
      background: blue;
      color: white;
    }
    ${transformTag("part-ssr-shadow-cmp")}::part(container) {
      border: 2px solid red;
      background: pink;
    }`; }
}, [257, "part-wrap-ssr-shadow-cmp", {
        "selected": [4]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["part-wrap-ssr-shadow-cmp", "part-ssr-shadow-cmp"];
    components.forEach(tagName => { switch (tagName) {
        case "part-wrap-ssr-shadow-cmp":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SsrWrapShadowCmp);
            }
            break;
        case "part-ssr-shadow-cmp":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const PartWrapSsrShadowCmp = SsrWrapShadowCmp;
const defineCustomElement = defineCustomElement$1;

export { PartWrapSsrShadowCmp, defineCustomElement };
