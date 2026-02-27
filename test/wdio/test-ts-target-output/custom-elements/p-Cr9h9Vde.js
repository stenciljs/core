import { t as transformTag, p as proxyCustomElement, c as createEvent, h } from './index.js';
import { F as FormFieldBase } from './p-C2ris2BX.js';

const RadioGroupCmp = /*@__PURE__*/ proxyCustomElement(class RadioGroupCmp extends FormFieldBase {
    get el() { return this; }
    value = undefined;
    helperText = 'Select an option';
    valueChange;
    inputId = `radio-group-${Math.random().toString(36).substr(2, 9)}`;
    helperTextId = `${this.inputId}-helper-text`;
    errorTextId = `${this.inputId}-error-text`;
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.valueChange = createEvent(this, "valueChange");
        // Set up validation callback
        this.setValidationCallback((val) => {
            if (!val) {
                return 'Please select an option';
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
        const radio = e.target;
        if (radio.checked) {
            this.value = radio.value;
            this.valueChange.emit(this.value);
            this.validate(this.value);
        }
    };
    onFocus = () => {
        this.handleFocusEvent();
    };
    onBlur = () => {
        this.handleBlurEvent(this.value);
    };
    render() {
        const focusState = this.getFocusState();
        const validationData = this.getValidationMessageData(this.helperTextId, this.errorTextId);
        return (h("div", { key: '08991b2a2a3d702f0105fa47156288eef526d690', class: "radio-group-container" }, h("label", { key: 'a438364333b9df4fc25f8705b5278533ee03777f' }, "Select Option"), h("div", { key: 'd24409d26808e10fe7af52b89bbc9a55d9e71bb7', class: "radio-group", tabindex: "0", onFocus: this.onFocus, onBlur: this.onBlur }, h("label", { key: '1adde2f9b61053eeed8c5575905e6c879a15d837' }, h("input", { key: '29fd94becb11e2b13ef8c52a08fba0ebc6279d17', type: "radio", name: this.inputId, value: "option1", checked: this.value === 'option1', onChange: this.handleChange }), "Option 1"), h("label", { key: '72ddab6e267fbe80ea0965dad64341ab546ecea0' }, h("input", { key: '9a0ac9528f464cca217a527bf8766debf3d16e9a', type: "radio", name: this.inputId, value: "option2", checked: this.value === 'option2', onChange: this.handleChange }), "Option 2"), h("label", { key: '42ae2249fd6a70091f432369a4747c5b3dc6ef37' }, h("input", { key: '6a091ddf67a3cee7ade3a1f7979926c4b76d3914', type: "radio", name: this.inputId, value: "option3", checked: this.value === 'option3', onChange: this.handleChange }), "Option 3")), validationData.hasError && (h("div", { key: 'ff1164c4bcfb2f9a095953be8018a28f583c516c', class: "validation-message" }, h("div", { key: '5fd3f9d965f0972fb517c0dfca7af9a7486ec6a6', id: validationData.errorTextId, class: "error-text" }, validationData.errorMessage))), h("div", { key: 'eebefbd16c09da31dc2149c4faebc5742af76aa2', class: "focus-info" }, "Focused: ", focusState.isFocused ? 'Yes' : 'No', " | Focus Count: ", focusState.focusCount, " | Blur Count:", ' ', focusState.blurCount)));
    }
}, [512, "inheritance-radio-group", {
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
    const components = ["inheritance-radio-group"];
    components.forEach(tagName => { switch (tagName) {
        case "inheritance-radio-group":
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), RadioGroupCmp);
            }
            break;
    } });
}
defineCustomElement();

export { RadioGroupCmp as R, defineCustomElement as d };
//# sourceMappingURL=p-Cr9h9Vde.js.map

//# sourceMappingURL=p-Cr9h9Vde.js.map