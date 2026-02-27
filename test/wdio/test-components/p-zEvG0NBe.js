import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const CustomElementNestedChild = /*@__PURE__*/ proxyCustomElement(class CustomElementNestedChild extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return (h("div", { key: 'e90bd008a3ee8ef3f4b6404e7b16b247a11a3d11' }, h("strong", { key: 'c7ca3355cfc19558588251351318b6c83fdc9357' }, "Child Nested Component Loaded!")));
    }
}, [1, "custom-element-nested-child"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["custom-element-nested-child"];
    components.forEach(tagName => { switch (tagName) {
        case "custom-element-nested-child":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CustomElementNestedChild);
            }
            break;
    } });
}

export { CustomElementNestedChild as C, defineCustomElement as d };
