import { p as proxyCustomElement, h, t as transformTag } from './p-DYdAJnXF.js';
import { F as FormFieldBase } from './p-BJ8AzlMm.js';

const TextInputCmp = /*@__PURE__*/ proxyCustomElement(class TextInputCmp extends FormFieldBase {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.value = '';
        this.helperText = 'Enter your name';
        this.inputId = `text-input-${Math.random().toString(36).substr(2, 9)}`;
        this.helperTextId = `${this.inputId}-helper-text`;
        this.errorTextId = `${this.inputId}-error-text`;
        this.handleInput = (e) => {
            const input = e.target;
            this.value = input.value;
        };
        this.onFocus = () => {
            this.handleFocusEvent();
        };
        this.onBlur = () => {
            this.handleBlurEvent(this.value);
        };
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
    render() {
        const focusState = this.getFocusState();
        const validationState = this.getValidationState();
        const validationData = this.getValidationMessageData(this.helperTextId, this.errorTextId);
        return (h("div", { key: 'ecfeab6405295c7fc3e7f73972cb13a537b157a7', class: "text-input-container" }, h("label", { key: 'a667b4033673fb6e2f011335dc1f8f7b26cc9b6e', htmlFor: this.inputId }, "Name"), h("input", { key: '3e247cf223ee25dd63b69a88c45a2ba0b0c7472c', id: this.inputId, type: "text", value: this.value, onInput: this.handleInput, onFocus: this.onFocus, onBlur: this.onBlur, class: validationState.isValid ? '' : 'invalid' }), validationData.hasError && (h("div", { key: '673af58722097a3bf23aac16cfbd831d9ae370d0', class: "validation-message" }, h("div", { key: 'eb985f1cd1cb25be80086413168854c85f3fe384', id: validationData.errorTextId, class: "error-text" }, validationData.errorMessage))), h("div", { key: 'a2f5ed16cd26fe14073de0c765d74f82848b904f', class: "focus-info" }, "Focused: ", focusState.isFocused ? 'Yes' : 'No', " | Focus Count: ", focusState.focusCount, " | Blur Count:", ' ', focusState.blurCount)));
    }
    get el() { return this; }
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
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), TextInputCmp);
            }
            break;
    } });
}

export { TextInputCmp as T, defineCustomElement as d };
