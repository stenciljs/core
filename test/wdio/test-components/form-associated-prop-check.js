import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const FormAssociatedPropCheck$1 = /*@__PURE__*/ proxyCustomElement(class FormAssociatedPropCheck extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return (h("div", { key: '7548729a5e59861a01cc3d18397d79f1d7d9307b', style: { cursor: 'pointer', padding: '10px', border: '1px solid #ccc' } }, h("p", { key: '81a0d42957a58735e09f073e332fc2abce2e4afb' }, "Disabled prop value: ", String(this.disabled))));
    }
    static get formAssociated() { return true; }
}, [65, "form-associated-prop-check", {
        "disabled": [4]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["form-associated-prop-check"];
    components.forEach(tagName => { switch (tagName) {
        case "form-associated-prop-check":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), FormAssociatedPropCheck$1);
            }
            break;
    } });
}

const FormAssociatedPropCheck = FormAssociatedPropCheck$1;
const defineCustomElement = defineCustomElement$1;

export { FormAssociatedPropCheck, defineCustomElement };
