import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const DomReattachCloneDeep = /*@__PURE__*/ proxyCustomElement(class DomReattachCloneDeep extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: 'f2433dfe4d57a6cc67c42f08b6a3105baf7be068', class: "wrapper" }, h("span", { key: 'e677fef8f1464dce4645dc29e93400b742bb04c4', class: "component-mark-up" }, "Component mark-up"), h("div", { key: '67fbe48ae08ac4e8faf265f2c18518f4bfb12a44' }, h("section", { key: '6fcf609ac5b7d2bebcc701914db56bf55bc358ed' }, h("slot", { key: '8800f1aaf129f074fc747d62a7f1408bfd179377' })))));
    }
}, [262, "dom-reattach-clone-deep-slot"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["dom-reattach-clone-deep-slot"];
    components.forEach(tagName => { switch (tagName) {
        case "dom-reattach-clone-deep-slot":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), DomReattachCloneDeep);
            }
            break;
    } });
}

const DomReattachCloneDeepSlot = DomReattachCloneDeep;
const defineCustomElement = defineCustomElement$1;

export { DomReattachCloneDeepSlot, defineCustomElement };
