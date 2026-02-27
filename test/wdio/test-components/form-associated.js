import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const FormAssociatedCmp = /*@__PURE__*/ proxyCustomElement(class FormAssociatedCmp extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.internals = this.attachInternals();
    }
    componentWillLoad() {
        this.internals.setFormValue('my default value');
    }
    formAssociatedCallback(form) {
        form.ariaLabel = 'formAssociated called';
        // this is a regression test for #5106 which ensures that `this` is
        // resolved correctly
        this.internals.setValidity({});
    }
    formResetCallback() {
        this.internals.form.ariaLabel = 'formResetCallback called';
    }
    formDisabledCallback(disabled) {
        this.internals.form.ariaLabel = `formDisabledCallback called with ${disabled}`;
    }
    render() {
        return h("input", { key: 'f4ef251a509103d7bf29005d66972ef7c55f2b36', type: "text" });
    }
    static get formAssociated() { return true; }
}, [64, "form-associated"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["form-associated"];
    components.forEach(tagName => { switch (tagName) {
        case "form-associated":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), FormAssociatedCmp);
            }
            break;
    } });
}

const FormAssociated = FormAssociatedCmp;
const defineCustomElement = defineCustomElement$1;

export { FormAssociated, defineCustomElement };
