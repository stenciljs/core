import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$3 } from './p-89yvifIU.js';
import { d as defineCustomElement$2 } from './p-zEvG0NBe.js';

const CustomElementRoot$1 = /*@__PURE__*/ proxyCustomElement(class CustomElementRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return (h("div", { key: '03c7a6a6ec8f84db429348d0c791386acda089dc' }, h("h2", { key: 'e2a72a08ba421f4254ec0c20086c05c48f495987' }, "Root Element Loaded"), h("h3", { key: '607575be3337aded2f31020a24f7f465bb30d11b' }, "Child Component Loaded?"), h("custom-element-child", { key: '4d96119edfd36d26c87d120d5fade8da07686e7c' })));
    }
}, [1, "custom-element-root"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["custom-element-root", "custom-element-child", "custom-element-nested-child"];
    components.forEach(tagName => { switch (tagName) {
        case "custom-element-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CustomElementRoot$1);
            }
            break;
        case "custom-element-child":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$3();
            }
            break;
        case "custom-element-nested-child":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const CustomElementRoot = CustomElementRoot$1;
const defineCustomElement = defineCustomElement$1;

export { CustomElementRoot, defineCustomElement };
