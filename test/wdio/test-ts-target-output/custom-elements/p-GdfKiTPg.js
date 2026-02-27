import { t as transformTag, p as proxyCustomElement, h } from './index.js';
import { R as ReactiveControllerHost, V as ValidationController, F as FocusController } from './p-3P45Gqp1.js';

const TextInputCmp = /*@__PURE__*/ proxyCustomElement(class TextInputCmp extends ReactiveControllerHost {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    get el() { return this; }
    value = '';
    helperText = 'Enter your name';
    // Controllers via composition
    validation = new ValidationController(this);
    focus = new FocusController(this);
    inputId = `text-input-${Math.random().toString(36).substr(2, 9)}`;
    helperTextId = `${this.inputId}-helper-text`;
    errorTextId = `${this.inputId}-error-text`;
    componentWillLoad() {
        super.componentWillLoad(); // Call base class to trigger controllers
        // Set up validation callback
        this.validation.setValidationCallback((val) => {
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
        super.componentDidLoad(); // Call base class to trigger controllers
    }
    disconnectedCallback() {
        super.disconnectedCallback(); // Call base class to trigger controllers
    }
    handleInput = (e) => {
        const input = e.target;
        this.value = input.value;
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
        const validationState = this.validation.getValidationState();
        const validationData = this.validation.getValidationMessageData(this.helperTextId, this.errorTextId);
        return (h("div", { key: '1d711abd9c20d9fc992be361839420a7ead63a3a', class: "text-input-container" }, h("label", { key: 'ad8409bcac222432a480a77af6290732884e50fa', htmlFor: this.inputId }, "Name"), h("input", { key: '8ad1b41291346dbfbbd167c89882f9fec78ad791', id: this.inputId, type: "text", value: this.value, onInput: this.handleInput, onFocus: this.handleFocus, onBlur: this.handleBlur, class: validationState.isValid ? '' : 'invalid' }), validationData.hasError && (h("div", { key: 'dbda8f191bd86a4f1b3474643a745f0f42571343', class: "validation-message" }, h("div", { key: 'fc1fc315306bfdadd3bc353eb9a6a7d3b8a1a50a', id: validationData.errorTextId, class: "error-text" }, validationData.errorMessage))), h("div", { key: '2a91788647179676cc3cc2a9eb8b054278a0e956', class: "focus-info" }, "Focused: ", focusState.isFocused ? 'Yes' : 'No', " | Focus Count: ", focusState.focusCount, " | Blur Count:", ' ', focusState.blurCount)));
    }
}, [512, "composition-text-input", {
        "value": [32],
        "helperText": [32]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["composition-text-input"];
    components.forEach(tagName => { switch (tagName) {
        case "composition-text-input":
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), TextInputCmp);
            }
            break;
    } });
}
defineCustomElement();

export { TextInputCmp as T, defineCustomElement as d };
//# sourceMappingURL=p-GdfKiTPg.js.map

//# sourceMappingURL=p-GdfKiTPg.js.map