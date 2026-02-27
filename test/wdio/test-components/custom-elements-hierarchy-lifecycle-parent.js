import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { c as createAndAppendElement, d as defineCustomElement$2 } from './p-0ylG4vox.js';

const CustomElementsHierarchyLifecycleParent$1 = /*@__PURE__*/ proxyCustomElement(class CustomElementsHierarchyLifecycleParent extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    async componentDidLoad() {
        createAndAppendElement('DID LOAD PARENT');
        return Promise.resolve();
    }
    render() {
        return h("custom-elements-hierarchy-lifecycle-child", { key: '0124ba6876d4cbfe6d8af79d355244e352fc99d6' });
    }
}, [1, "custom-elements-hierarchy-lifecycle-parent"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["custom-elements-hierarchy-lifecycle-parent", "custom-elements-hierarchy-lifecycle-child"];
    components.forEach(tagName => { switch (tagName) {
        case "custom-elements-hierarchy-lifecycle-parent":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CustomElementsHierarchyLifecycleParent$1);
            }
            break;
        case "custom-elements-hierarchy-lifecycle-child":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const CustomElementsHierarchyLifecycleParent = CustomElementsHierarchyLifecycleParent$1;
const defineCustomElement = defineCustomElement$1;

export { CustomElementsHierarchyLifecycleParent, defineCustomElement };
