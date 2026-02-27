import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const CmpTag88 = /*@__PURE__*/ proxyCustomElement(class CmpTag88 extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return h("div", { key: '9b809e98160c0fc7dba1aaccd9acd382ca61be20' }, "tag-88");
    }
}, [0, "tag-88"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["tag-88"];
    components.forEach(tagName => { switch (tagName) {
        case "tag-88":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CmpTag88);
            }
            break;
    } });
}

const Tag88 = CmpTag88;
const defineCustomElement = defineCustomElement$1;

export { Tag88, defineCustomElement };
