import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$1 } from './p-zEvG0NBe.js';

const CustomElementChild = /*@__PURE__*/ proxyCustomElement(class CustomElementChild extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return (h("div", { key: 'e1da6f84ee2db975d4bb07d8411e476d38d4422a' }, h("strong", { key: '96aa0faaa30424eec45fcaa71ba26da5d8e8a296' }, "Child Component Loaded!"), h("h3", { key: '9fe1022c6b323f6319c229ceef6c4708e44c348a' }, "Child Nested Component?"), h("custom-element-nested-child", { key: '26aeaa96d4147f86ae6d4854c47d61e979e7d1e5' })));
    }
}, [1, "custom-element-child"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["custom-element-child", "custom-element-nested-child"];
    components.forEach(tagName => { switch (tagName) {
        case "custom-element-child":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CustomElementChild);
            }
            break;
        case "custom-element-nested-child":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$1();
            }
            break;
    } });
}

export { CustomElementChild as C, defineCustomElement as d };
