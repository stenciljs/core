import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const DomReattachCloneHost$1 = /*@__PURE__*/ proxyCustomElement(class DomReattachCloneHost extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h(Host, { key: '5fd26f153b7cf77bffc103f337b0306057e8a24f' }, h("span", { key: '5e097cf77a074aa17ee951400c5897f2b0cf379e', class: "component-mark-up" }, "Component mark-up"), h("slot", { key: '49f3134e54c7b103a08b73ada505f7760d438912' })));
    }
}, [262, "dom-reattach-clone-host"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["dom-reattach-clone-host"];
    components.forEach(tagName => { switch (tagName) {
        case "dom-reattach-clone-host":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), DomReattachCloneHost$1);
            }
            break;
    } });
}

const DomReattachCloneHost = DomReattachCloneHost$1;
const defineCustomElement = defineCustomElement$1;

export { DomReattachCloneHost, defineCustomElement };
