import { p as proxyCustomElement, H, t as transformTag } from './p-DYdAJnXF.js';

const AttributeComplex$1 = /*@__PURE__*/ proxyCustomElement(class AttributeComplex extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.nu0 = 1;
        this.bool0 = true;
        this.str0 = 'hello';
        this._obj = { name: 'James bond' };
    }
    get obj() {
        return JSON.stringify(this._obj);
    }
    set obj(newVal) {
        if (typeof newVal === 'string') {
            this._obj = { name: newVal };
        }
    }
    async getInstance() {
        return this;
    }
}, [0, "attribute-complex", {
        "nu0": [2, "nu-0"],
        "nu1": [2, "nu-1"],
        "nu2": [2, "nu-2"],
        "bool0": [4, "bool-0"],
        "bool1": [4, "bool-1"],
        "bool2": [4, "bool-2"],
        "str0": [1, "str-0"],
        "str1": [1, "str-1"],
        "str2": [1, "str-2"],
        "obj": [6145],
        "getInstance": [64]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["attribute-complex"];
    components.forEach(tagName => { switch (tagName) {
        case "attribute-complex":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), AttributeComplex$1);
            }
            break;
    } });
}

const AttributeComplex = AttributeComplex$1;
const defineCustomElement = defineCustomElement$1;

export { AttributeComplex, defineCustomElement };
