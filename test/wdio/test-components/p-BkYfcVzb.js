import { p as proxyCustomElement, e as createEvent, h, t as transformTag } from './p-DYdAJnXF.js';
import { R as ReactiveControllerHost, V as ValidationController, F as FocusController } from './p-BeF4DdtY.js';

const RadioGroupCmp = /*@__PURE__*/ proxyCustomElement(class RadioGroupCmp extends ReactiveControllerHost {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.valueChange = createEvent(this, "valueChange");
        this.value = undefined;
        this.helperText = 'Select an option';
        // Controllers via composition
        this.validation = new ValidationController(this);
        this.focus = new FocusController(this);
        this.inputId = `radio-group-${Math.random().toString(36).substr(2, 9)}`;
        this.helperTextId = `${this.inputId}-helper-text`;
        this.errorTextId = `${this.inputId}-error-text`;
        this.handleChange = (e) => {
            const radio = e.target;
            if (radio.checked) {
                this.value = radio.value;
                this.valueChange.emit(this.value);
                this.validation.validate(this.value);
            }
        };
        this.handleFocus = () => {
            this.focus.handleFocus();
        };
        this.handleBlur = () => {
            this.focus.handleBlur();
            this.validation.handleBlur(this.value);
        };
    }
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
    render() {
        const focusState = this.focus.getFocusState();
        const validationData = this.validation.getValidationMessageData(this.helperTextId, this.errorTextId);
        return (h("div", { key: 'f1c8ad93dfca379966c24ff2c57aa56a728c146d', class: "radio-group-container" }, h("label", { key: 'df594980a9805c51a7d3dc361eb67e9bc10d1d8f' }, "Select Option"), h("div", { key: '8381a600d8000904b3deaaba3f239a03b3b969ab', class: "radio-group", tabindex: "0", onFocus: this.handleFocus, onBlur: this.handleBlur }, h("label", { key: '045712404e3252c7c231638dcb8569903364f5f6' }, h("input", { key: 'c8e0fd6fe6ff96d57df62bc43b84e630aedc0831', type: "radio", name: this.inputId, value: "option1", checked: this.value === 'option1', onChange: this.handleChange }), "Option 1"), h("label", { key: 'a9a1449cf0e934a05d0cef6d103ee55d8a52acba' }, h("input", { key: 'a96a5124f7df6a32c53f2d68e41c71baeb0023de', type: "radio", name: this.inputId, value: "option2", checked: this.value === 'option2', onChange: this.handleChange }), "Option 2"), h("label", { key: '8f69bc97c909c7fd17a11a00276192d26362a8a3' }, h("input", { key: 'ad3ea33516f3e6cd1d867d1941506d553d636f3f', type: "radio", name: this.inputId, value: "option3", checked: this.value === 'option3', onChange: this.handleChange }), "Option 3")), validationData.hasError && (h("div", { key: 'ce5e1930e1ba6aa0b2642905d826022a96d4dbaf', class: "validation-message" }, h("div", { key: 'c78007c2ff2163b42d6c6e03c5078424ead44bc3', id: validationData.errorTextId, class: "error-text" }, validationData.errorMessage))), h("div", { key: 'dabb3cb6eb855e4515fd91cce8b7d678eb31d9fc', class: "focus-info" }, "Focused: ", focusState.isFocused ? 'Yes' : 'No', " | Focus Count: ", focusState.focusCount, " | Blur Count:", ' ', focusState.blurCount)));
    }
    get el() { return this; }
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
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), RadioGroupCmp);
            }
            break;
    } });
}

export { RadioGroupCmp as R, defineCustomElement as d };
