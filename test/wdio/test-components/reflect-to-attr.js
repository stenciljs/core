import { p as proxyCustomElement, H, t as transformTag } from './p-DYdAJnXF.js';

const ReflectToAttr$1 = /*@__PURE__*/ proxyCustomElement(class ReflectToAttr extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.str = 'single';
        this.nu = 2;
        this.null = null;
        this.bool = false;
        this.otherBool = true;
        this.disabled = false;
    }
    componentDidLoad() {
        this.dynamicStr = 'value';
        this.el.dynamicNu = 123;
    }
    get el() { return this; }
}, [0, "reflect-to-attr", {
        "str": [513],
        "nu": [514],
        "undef": [513],
        "null": [513],
        "bool": [516],
        "otherBool": [516, "other-bool"],
        "disabled": [516],
        "dynamicStr": [1537, "dynamic-str"],
        "dynamicNu": [514, "dynamic-nu"]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["reflect-to-attr"];
    components.forEach(tagName => { switch (tagName) {
        case "reflect-to-attr":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ReflectToAttr$1);
            }
            break;
    } });
}

const ReflectToAttr = ReflectToAttr$1;
const defineCustomElement = defineCustomElement$1;

export { ReflectToAttr, defineCustomElement };
