import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const CmpSlottedParentnode$1 = /*@__PURE__*/ proxyCustomElement(class CmpSlottedParentnode extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h(Host, { key: '88ef69876dd4e6b42363839daecfec6b787088dc' }, h("label", { key: 'fc9adf6755f36c7283140782013cc1b446fdea64' }, h("slot", { key: 'f644d885f39e77097f59c3c5c2bbadef69c0f723' }))));
    }
}, [262, "cmp-slotted-parentnode"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["cmp-slotted-parentnode"];
    components.forEach(tagName => { switch (tagName) {
        case "cmp-slotted-parentnode":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CmpSlottedParentnode$1);
            }
            break;
    } });
}

const CmpSlottedParentnode = CmpSlottedParentnode$1;
const defineCustomElement = defineCustomElement$1;

export { CmpSlottedParentnode, defineCustomElement };
