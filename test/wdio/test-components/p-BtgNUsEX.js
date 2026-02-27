import { p as proxyCustomElement, e as createEvent, h, t as transformTag } from './p-DYdAJnXF.js';
import { F as FormFieldBase } from './p-BJ8AzlMm.js';

const CheckboxGroupCmp = /*@__PURE__*/ proxyCustomElement(class CheckboxGroupCmp extends FormFieldBase {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.valueChange = createEvent(this, "valueChange");
        this.values = [];
        this.helperText = 'Select at least one option';
        this.inputId = `checkbox-group-${Math.random().toString(36).substr(2, 9)}`;
        this.helperTextId = `${this.inputId}-helper-text`;
        this.errorTextId = `${this.inputId}-error-text`;
        this.handleChange = (e) => {
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
        this.onFocus = () => {
            this.handleFocusEvent();
        };
        this.onBlur = () => {
            this.handleBlurEvent(this.values);
        };
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
    render() {
        const focusState = this.getFocusState();
        const validationData = this.getValidationMessageData(this.helperTextId, this.errorTextId);
        return (h("div", { key: '5a41aae6ca2a61a61a6ca8d2793b73c17015b1d8', class: "checkbox-group-container" }, h("label", { key: '88c44bd5873533e66d0daa96bd16b653747213ae' }, "Select Options"), h("div", { key: '89e669b02d46bb8b67854c2aac7c8a44bcd44b46', class: "checkbox-group", tabindex: "0", onFocus: this.onFocus, onBlur: this.onBlur }, h("label", { key: '95e11bb69b059438c5661597d6cb81132ca60e2f' }, h("input", { key: '0defd4de57feca00c4e929146a039f45cf084bea', type: "checkbox", name: this.inputId, value: "option1", checked: this.values.includes('option1'), onChange: this.handleChange }), "Option 1"), h("label", { key: '2aa1d4d9c1573a99477c8067fa6e8798527f7566' }, h("input", { key: 'b82448128e0a3ae8b092dbaaf95b4e608474e78b', type: "checkbox", name: this.inputId, value: "option2", checked: this.values.includes('option2'), onChange: this.handleChange }), "Option 2"), h("label", { key: '128abfe5dc9637442cdc3b56506dcb4d01e4f0e9' }, h("input", { key: 'd720fbf5b465b49e03b04bb02f929485bbfc187e', type: "checkbox", name: this.inputId, value: "option3", checked: this.values.includes('option3'), onChange: this.handleChange }), "Option 3")), validationData.hasError && (h("div", { key: 'b520f6d9316feb21aa90b389edd8b5e040458b8d', class: "validation-message" }, h("div", { key: '0e95698e7187af005f226092f16c1f6c3c284a2d', id: validationData.errorTextId, class: "error-text" }, validationData.errorMessage))), h("div", { key: '1ec2dac1bc69997edd34b40aca353cc95bf9728d', class: "focus-info" }, "Focused: ", focusState.isFocused ? 'Yes' : 'No', " | Focus Count: ", focusState.focusCount, " | Blur Count:", ' ', focusState.blurCount)));
    }
    get el() { return this; }
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
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CheckboxGroupCmp);
            }
            break;
    } });
}

export { CheckboxGroupCmp as C, defineCustomElement as d };
