import { t as transformTag, p as proxyCustomElement, h } from './index.js';
import { F as FormFieldBase } from './p-C2ris2BX.js';

const TextInputCmp = /*@__PURE__*/ proxyCustomElement(class TextInputCmp extends FormFieldBase {
    get el() { return this; }
    value = '';
    helperText = 'Enter your name';
    inputId = `text-input-${Math.random().toString(36).substr(2, 9)}`;
    helperTextId = `${this.inputId}-helper-text`;
    errorTextId = `${this.inputId}-error-text`;
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
        // Set up validation callback
        this.setValidationCallback((val) => {
            if (!val || val.trim().length === 0) {
                return 'Name is required';
            }
            if (val.length < 2) {
                return 'Name must be at least 2 characters';
            }
            return undefined;
        });
    }
    componentDidLoad() {
        super.componentDidLoad();
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    handleInput = (e) => {
        const input = e.target;
        this.value = input.value;
    };
    onFocus = () => {
        this.handleFocusEvent();
    };
    onBlur = () => {
        this.handleBlurEvent(this.value);
    };
    render() {
        const focusState = this.getFocusState();
        const validationState = this.getValidationState();
        const validationData = this.getValidationMessageData(this.helperTextId, this.errorTextId);
        return (h("div", { key: '05cc89255fedefba8fdef8561a01a70fa406c134', class: "text-input-container" }, h("label", { key: 'd0b14fcddc5d40841c21c0c17f1d6328e2f52cf5', htmlFor: this.inputId }, "Name"), h("input", { key: '0ebe5c2a1f38ddbb43346e1d42de9ebe0b32ae04', id: this.inputId, type: "text", value: this.value, onInput: this.handleInput, onFocus: this.onFocus, onBlur: this.onBlur, class: validationState.isValid ? '' : 'invalid' }), validationData.hasError && (h("div", { key: '801ebbc3193912dc0b9869b7698fe5551729157d', class: "validation-message" }, h("div", { key: '0c4449ba491d5b1a477212c80dd4cd3499af4a07', id: validationData.errorTextId, class: "error-text" }, validationData.errorMessage))), h("div", { key: 'ba8929ff41ad4d6df36aa2f0502ff83992595f9e', class: "focus-info" }, "Focused: ", focusState.isFocused ? 'Yes' : 'No', " | Focus Count: ", focusState.focusCount, " | Blur Count:", ' ', focusState.blurCount)));
    }
}, [512, "inheritance-text-input", {
        "isFocused": [32],
        "focusCount": [32],
        "blurCount": [32],
        "isValid": [32],
        "errorMessage": [32],
        "value": [32],
        "helperText": [32]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["inheritance-text-input"];
    components.forEach(tagName => { switch (tagName) {
        case "inheritance-text-input":
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), TextInputCmp);
            }
            break;
    } });
}
defineCustomElement();

export { TextInputCmp as T, defineCustomElement as d };
//# sourceMappingURL=p-CXvEULZN.js.map

//# sourceMappingURL=p-CXvEULZN.js.map