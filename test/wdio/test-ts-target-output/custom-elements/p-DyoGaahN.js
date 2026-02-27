import { t as transformTag, p as proxyCustomElement, c as createEvent, h } from './index.js';
import { R as ReactiveControllerHost, V as ValidationController, F as FocusController } from './p-3P45Gqp1.js';

const RadioGroupCmp = /*@__PURE__*/ proxyCustomElement(class RadioGroupCmp extends ReactiveControllerHost {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.valueChange = createEvent(this, "valueChange");
    }
    get el() { return this; }
    value = undefined;
    helperText = 'Select an option';
    valueChange;
    // Controllers via composition
    validation = new ValidationController(this);
    focus = new FocusController(this);
    inputId = `radio-group-${Math.random().toString(36).substr(2, 9)}`;
    helperTextId = `${this.inputId}-helper-text`;
    errorTextId = `${this.inputId}-error-text`;
    componentWillLoad() {
        super.componentWillLoad(); // Call base class to trigger controllers
        // Set up validation callback
        this.validation.setValidationCallback((val) => {
            if (!val) {
                return 'Please select an option';
            }
            return undefined;
        });
    }
    componentDidLoad() {
        super.componentDidLoad(); // Call base class to trigger controllers
    }
    disconnectedCallback() {
        super.disconnectedCallback(); // Call base class to trigger controllers
    }
    handleChange = (e) => {
        const radio = e.target;
        if (radio.checked) {
            this.value = radio.value;
            this.valueChange.emit(this.value);
            this.validation.validate(this.value);
        }
    };
    handleFocus = () => {
        this.focus.handleFocus();
    };
    handleBlur = () => {
        this.focus.handleBlur();
        this.validation.handleBlur(this.value);
    };
    render() {
        const focusState = this.focus.getFocusState();
        const validationData = this.validation.getValidationMessageData(this.helperTextId, this.errorTextId);
        return (h("div", { key: 'b693688c5670e0d3c9fa1ef19315db19a90888d7', class: "radio-group-container" }, h("label", { key: '24c45d8346a096922730114f056e9c3ad282c302' }, "Select Option"), h("div", { key: 'a2bfa7ca9f03854314507d928c85c55bcd27ad20', class: "radio-group", tabindex: "0", onFocus: this.handleFocus, onBlur: this.handleBlur }, h("label", { key: '71f0f9273f278d59f90d029596bad6faf13e3df0' }, h("input", { key: '449782f694903b22a6e2b6bea3e09701fde69ef6', type: "radio", name: this.inputId, value: "option1", checked: this.value === 'option1', onChange: this.handleChange }), "Option 1"), h("label", { key: 'a5cef908f322cf87ca382f422e13f29bcbdc2d79' }, h("input", { key: '99db0da30fc71637c88ab3dc57f11a90e95920ef', type: "radio", name: this.inputId, value: "option2", checked: this.value === 'option2', onChange: this.handleChange }), "Option 2"), h("label", { key: 'a595e484944acf25d44d3b6315c966e9aa268e1a' }, h("input", { key: 'b187fb7381bed329d1b47baa15454332b5f0eaad', type: "radio", name: this.inputId, value: "option3", checked: this.value === 'option3', onChange: this.handleChange }), "Option 3")), validationData.hasError && (h("div", { key: 'a391b1aefe788998b593e741b3e3755a7de7cfb8', class: "validation-message" }, h("div", { key: 'ef49b5792081f9d33ed64ac81baa4cac4d1d0793', id: validationData.errorTextId, class: "error-text" }, validationData.errorMessage))), h("div", { key: '8fd188cd2d6384d57151efe8e7ca6827b6e6e751', class: "focus-info" }, "Focused: ", focusState.isFocused ? 'Yes' : 'No', " | Focus Count: ", focusState.focusCount, " | Blur Count:", ' ', focusState.blurCount)));
    }
}, [512, "composition-radio-group", {
        "value": [32],
        "helperText": [32]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["composition-radio-group"];
    components.forEach(tagName => { switch (tagName) {
        case "composition-radio-group":
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), RadioGroupCmp);
            }
            break;
    } });
}
defineCustomElement();

export { RadioGroupCmp as R, defineCustomElement as d };
//# sourceMappingURL=p-DyoGaahN.js.map

//# sourceMappingURL=p-DyoGaahN.js.map