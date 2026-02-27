import { t as transformTag, p as proxyCustomElement, c as createEvent, h } from './index.js';
import { R as ReactiveControllerHost, V as ValidationController, F as FocusController } from './p-3P45Gqp1.js';

const CheckboxGroupCmp = /*@__PURE__*/ proxyCustomElement(class CheckboxGroupCmp extends ReactiveControllerHost {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.valueChange = createEvent(this, "valueChange");
    }
    get el() { return this; }
    values = [];
    helperText = 'Select at least one option';
    valueChange;
    // Controllers via composition
    validation = new ValidationController(this);
    focus = new FocusController(this);
    inputId = `checkbox-group-${Math.random().toString(36).substr(2, 9)}`;
    helperTextId = `${this.inputId}-helper-text`;
    errorTextId = `${this.inputId}-error-text`;
    componentWillLoad() {
        super.componentWillLoad(); // Call base class to trigger controllers
        // Set up validation callback
        this.validation.setValidationCallback((vals) => {
            if (!vals || vals.length === 0) {
                return 'Please select at least one option';
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
        const checkbox = e.target;
        const value = checkbox.value;
        if (checkbox.checked) {
            this.values = [...this.values, value];
        }
        else {
            this.values = this.values.filter((v) => v !== value);
        }
        this.valueChange.emit(this.values);
        this.validation.validate(this.values);
    };
    handleFocus = () => {
        this.focus.handleFocus();
    };
    handleBlur = () => {
        this.focus.handleBlur();
        this.validation.handleBlur(this.values);
    };
    render() {
        const focusState = this.focus.getFocusState();
        const validationData = this.validation.getValidationMessageData(this.helperTextId, this.errorTextId);
        return (h("div", { key: '4f1f1ee280ccbc628699404cbed9b1f889f870d8', class: "checkbox-group-container" }, h("label", { key: '724aafcd8b14b2a23fac7f6502ca0a789ca9ac92' }, "Select Options"), h("div", { key: 'd1d3d4ee70ae1cff6ff3cafafbb42e8135ef4d34', class: "checkbox-group", tabindex: "0", onFocus: this.handleFocus, onBlur: this.handleBlur }, h("label", { key: '6282bc4812a27906cadbcf06bbe08c45cae0c266' }, h("input", { key: 'b164a85c8ebf9ed19cb6c2e757946a46a544a749', type: "checkbox", name: this.inputId, value: "option1", checked: this.values.includes('option1'), onChange: this.handleChange }), "Option 1"), h("label", { key: 'f7497abe6aa2ea9ad92f22e395fc88ad8ae4c71b' }, h("input", { key: 'fb82e1749c5481413a9838ad1d5c4fad4283f178', type: "checkbox", name: this.inputId, value: "option2", checked: this.values.includes('option2'), onChange: this.handleChange }), "Option 2"), h("label", { key: '2a8eb7b730d06ff21820d353977469c7714b001d' }, h("input", { key: 'c117326b3b6f58b5c0a530c0aa787edee3f9e35a', type: "checkbox", name: this.inputId, value: "option3", checked: this.values.includes('option3'), onChange: this.handleChange }), "Option 3")), validationData.hasError && (h("div", { key: '6349749e8cfaa420c4d30afbfb5813550c19902e', class: "validation-message" }, h("div", { key: '22113a6f35d8e0b4cb110c004bf5008295034e66', id: validationData.errorTextId, class: "error-text" }, validationData.errorMessage))), h("div", { key: 'e247ab14ccfc19770b5aec6ae17b4f4768ebf4ad', class: "focus-info" }, "Focused: ", focusState.isFocused ? 'Yes' : 'No', " | Focus Count: ", focusState.focusCount, " | Blur Count:", ' ', focusState.blurCount)));
    }
}, [512, "composition-checkbox-group", {
        "values": [32],
        "helperText": [32]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["composition-checkbox-group"];
    components.forEach(tagName => { switch (tagName) {
        case "composition-checkbox-group":
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), CheckboxGroupCmp);
            }
            break;
    } });
}
defineCustomElement();

export { CheckboxGroupCmp as C, defineCustomElement as d };
//# sourceMappingURL=p-CLQ7R6uc.js.map

//# sourceMappingURL=p-CLQ7R6uc.js.map