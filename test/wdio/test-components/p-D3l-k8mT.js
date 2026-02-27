import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const CustomElementChild = /*@__PURE__*/ proxyCustomElement(class CustomElementChild extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return (h("div", { key: 'f79f6a382d525fbed2678c346b22a8842600671b' }, h("strong", { key: '0f0ffcd65a3258c138125c97b18bc79a707c750a' }, "Child Component Loaded!")));
    }
}, [1, "custom-element-child-different-name-than-class"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["custom-element-child-different-name-than-class"];
    components.forEach(tagName => { switch (tagName) {
        case "custom-element-child-different-name-than-class":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CustomElementChild);
            }
            break;
    } });
}

export { CustomElementChild as C, defineCustomElement as d };
