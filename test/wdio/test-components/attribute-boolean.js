import { p as proxyCustomElement, H, t as transformTag } from './p-DYdAJnXF.js';

const AttributeBoolean$1 = /*@__PURE__*/ proxyCustomElement(class AttributeBoolean extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
}, [0, "attribute-boolean", {
        "boolState": [516, "bool-state"],
        "strState": [513, "str-state"],
        "noreflect": [4]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["attribute-boolean"];
    components.forEach(tagName => { switch (tagName) {
        case "attribute-boolean":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), AttributeBoolean$1);
            }
            break;
    } });
}

const AttributeBoolean = AttributeBoolean$1;
const defineCustomElement = defineCustomElement$1;

export { AttributeBoolean, defineCustomElement };
