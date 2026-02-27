import { t as transformTag, p as proxyCustomElement, c as createEvent, h } from './index.js';
import { F as FormFieldBase } from './p-C2ris2BX.js';

const CheckboxGroupCmp = /*@__PURE__*/ proxyCustomElement(class CheckboxGroupCmp extends FormFieldBase {
    get el() { return this; }
    values = [];
    helperText = 'Select at least one option';
    valueChange;
    inputId = `checkbox-group-${Math.random().toString(36).substr(2, 9)}`;
    helperTextId = `${this.inputId}-helper-text`;
    errorTextId = `${this.inputId}-error-text`;
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.valueChange = createEvent(this, "valueChange");
        // Set up validation callback
        this.setValidationCallback((vals) => {
            if (!vals || vals.length === 0) {
                return 'Please select at least one option';
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
    handleChange = (e) => {
        const checkbox = e.target;
        const value = checkbox.value;
        if (checkbox.checked) {
            this.values = [...this.values, value];
        }
        else {
            this.values = this.values.filter((v) => v !== value);
        }
        this.valueChange.emit(this.values);
        this.validate(this.values);
    };
    onFocus = () => {
        this.handleFocusEvent();
    };
    onBlur = () => {
        this.handleBlurEvent(this.values);
    };
    render() {
        const focusState = this.getFocusState();
        const validationData = this.getValidationMessageData(this.helperTextId, this.errorTextId);
        return (h("div", { key: '04790964f64c3c735d1f053ec278925f9d090a36', class: "checkbox-group-container" }, h("label", { key: '3048b0b5c043ce277323f83799901cf7ef4e444f' }, "Select Options"), h("div", { key: '0d5bf80a51869b6ecdc810dccdcce505a89c53e6', class: "checkbox-group", tabindex: "0", onFocus: this.onFocus, onBlur: this.onBlur }, h("label", { key: 'bba90b053731a7efd5a5988d0b380a313203ad7d' }, h("input", { key: '9cf8a791255d7af6ff695630372c2753f5235d49', type: "checkbox", name: this.inputId, value: "option1", checked: this.values.includes('option1'), onChange: this.handleChange }), "Option 1"), h("label", { key: '1d511b7f4b9865172d41378202b452cfcfdad125' }, h("input", { key: '8c0fcb434e7041bc58459ceeffe34c54498ec253', type: "checkbox", name: this.inputId, value: "option2", checked: this.values.includes('option2'), onChange: this.handleChange }), "Option 2"), h("label", { key: '70016906905f51f8b8e9bca47690ea71ee8a9042' }, h("input", { key: '2a7eee2cffb5c5a5f008f021eba17d260c1347c5', type: "checkbox", name: this.inputId, value: "option3", checked: this.values.includes('option3'), onChange: this.handleChange }), "Option 3")), validationData.hasError && (h("div", { key: '1a63385928c0752d9e02a7aa16fedc3199862af7', class: "validation-message" }, h("div", { key: '0474bb695deac05ae36202c017992d2c5cdad6d3', id: validationData.errorTextId, class: "error-text" }, validationData.errorMessage))), h("div", { key: 'ea39b8118fee16f567948d52f203135bf611ab37', class: "focus-info" }, "Focused: ", focusState.isFocused ? 'Yes' : 'No', " | Focus Count: ", focusState.focusCount, " | Blur Count:", ' ', focusState.blurCount)));
    }
}, [512, "inheritance-checkbox-group", {
        "isFocused": [32],
        "focusCount": [32],
        "blurCount": [32],
        "isValid": [32],
        "errorMessage": [32],
        "values": [32],
        "helperText": [32]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["inheritance-checkbox-group"];
    components.forEach(tagName => { switch (tagName) {
        case "inheritance-checkbox-group":
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), CheckboxGroupCmp);
            }
            break;
    } });
}
defineCustomElement();

export { CheckboxGroupCmp as C, defineCustomElement as d };
//# sourceMappingURL=p-DTzFmaP6.js.map

//# sourceMappingURL=p-DTzFmaP6.js.map