import { p as proxyCustomElement, e as createEvent, h, t as transformTag } from './p-DYdAJnXF.js';
import { F as FormFieldBase } from './p-BJ8AzlMm.js';

const RadioGroupCmp = /*@__PURE__*/ proxyCustomElement(class RadioGroupCmp extends FormFieldBase {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.valueChange = createEvent(this, "valueChange");
        this.value = undefined;
        this.helperText = 'Select an option';
        this.inputId = `radio-group-${Math.random().toString(36).substr(2, 9)}`;
        this.helperTextId = `${this.inputId}-helper-text`;
        this.errorTextId = `${this.inputId}-error-text`;
        this.handleChange = (e) => {
            const radio = e.target;
            if (radio.checked) {
                this.value = radio.value;
                this.valueChange.emit(this.value);
                this.validate(this.value);
            }
        };
        this.onFocus = () => {
            this.handleFocusEvent();
        };
        this.onBlur = () => {
            this.handleBlurEvent(this.value);
        };
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
    render() {
        const focusState = this.getFocusState();
        const validationData = this.getValidationMessageData(this.helperTextId, this.errorTextId);
        return (h("div", { key: '338d7767ed6147effcdc0c3af8f568196fc31529', class: "radio-group-container" }, h("label", { key: '5386bbbf5d34cb680f88e15689f7ecf385179b8e' }, "Select Option"), h("div", { key: '3ed5fe37885e13f43176132dd01439ad72c9971e', class: "radio-group", tabindex: "0", onFocus: this.onFocus, onBlur: this.onBlur }, h("label", { key: '25946d44c026792473436d8735cebb7b50fbd729' }, h("input", { key: '6daa9ddf88e4615139abccc366cbafdf89259f5b', type: "radio", name: this.inputId, value: "option1", checked: this.value === 'option1', onChange: this.handleChange }), "Option 1"), h("label", { key: 'a63f7cf9ceed4a8fb58b087a69c1e855aeb5fe3e' }, h("input", { key: 'a7197d1a47e4773d99ea9f4ecc95054841387b60', type: "radio", name: this.inputId, value: "option2", checked: this.value === 'option2', onChange: this.handleChange }), "Option 2"), h("label", { key: 'ba08e6e9d593c003ff6daaac625cb64d3ebad617' }, h("input", { key: '271ad7b0fce590d0ad3fca4c8ac97f5e09459209', type: "radio", name: this.inputId, value: "option3", checked: this.value === 'option3', onChange: this.handleChange }), "Option 3")), validationData.hasError && (h("div", { key: 'bac00d098a7d0efe34e935594e3390763a84bc2d', class: "validation-message" }, h("div", { key: '0b4b805650ec77e3411d66b0b6ef3ac5562b8f83', id: validationData.errorTextId, class: "error-text" }, validationData.errorMessage))), h("div", { key: '0e7b7c0adab3fa3c08aea1074f172852d556a9c0', class: "focus-info" }, "Focused: ", focusState.isFocused ? 'Yes' : 'No', " | Focus Count: ", focusState.focusCount, " | Blur Count:", ' ', focusState.blurCount)));
    }
    get el() { return this; }
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
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), RadioGroupCmp);
            }
            break;
    } });
}

export { RadioGroupCmp as R, defineCustomElement as d };
