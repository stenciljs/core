import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const CmpAvatar = /*@__PURE__*/ proxyCustomElement(class CmpAvatar extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: 'e804cd01ef9f05ff9745e6e220faf83152bcc92e', class: "container" }, h("slot", { key: 'c21fddfc185301eefc705b1f0c0bdbc574605eee' }, "DEFAULT")));
    }
}, [262, "cmp-avatar"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["cmp-avatar"];
    components.forEach(tagName => { switch (tagName) {
        case "cmp-avatar":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CmpAvatar);
            }
            break;
    } });
}

export { CmpAvatar as C, defineCustomElement as d };
