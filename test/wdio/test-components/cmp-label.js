import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const CmpLabel$1 = /*@__PURE__*/ proxyCustomElement(class CmpLabel extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h(Host, { key: '81e216c96c3c1b64a81835db89bbc77144cdca65' }, h("label", { key: 'd41f995992c12c0ad55de4512636b5394a38b4c8' }, h("slot", { key: '8ac6db31cfffc7e852f7309ad99035f00dee1720' }))));
    }
}, [262, "cmp-label"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["cmp-label"];
    components.forEach(tagName => { switch (tagName) {
        case "cmp-label":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CmpLabel$1);
            }
            break;
    } });
}

const CmpLabel = CmpLabel$1;
const defineCustomElement = defineCustomElement$1;

export { CmpLabel, defineCustomElement };
