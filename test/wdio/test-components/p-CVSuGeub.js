import { p as proxyCustomElement, h, t as transformTag } from './p-DYdAJnXF.js';
import { R as ReactiveControllerHost, V as ValidationController, F as FocusController } from './p-BeF4DdtY.js';

const TextInputCmp = /*@__PURE__*/ proxyCustomElement(class TextInputCmp extends ReactiveControllerHost {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.value = '';
        this.helperText = 'Enter your name';
        // Controllers via composition
        this.validation = new ValidationController(this);
        this.focus = new FocusController(this);
        this.inputId = `text-input-${Math.random().toString(36).substr(2, 9)}`;
        this.helperTextId = `${this.inputId}-helper-text`;
        this.errorTextId = `${this.inputId}-error-text`;
        this.handleInput = (e) => {
            const input = e.target;
            this.value = input.value;
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
    render() {
        const focusState = this.focus.getFocusState();
        const validationState = this.validation.getValidationState();
        const validationData = this.validation.getValidationMessageData(this.helperTextId, this.errorTextId);
        return (h("div", { key: '25df6360215abfa33957f61e52356e79399b2e48', class: "text-input-container" }, h("label", { key: 'd10399254b1fb9aabd0ebe2e446135392bd7d58c', htmlFor: this.inputId }, "Name"), h("input", { key: 'f5dae9d36e9b617f61d3fcd3916f49bc2bd20e24', id: this.inputId, type: "text", value: this.value, onInput: this.handleInput, onFocus: this.handleFocus, onBlur: this.handleBlur, class: validationState.isValid ? '' : 'invalid' }), validationData.hasError && (h("div", { key: 'bc1f1098c01146e2970036dc5fc95a5293fcda92', class: "validation-message" }, h("div", { key: 'cbcbb842df9fb4e23d296484287881b73ceb8006', id: validationData.errorTextId, class: "error-text" }, validationData.errorMessage))), h("div", { key: 'ba14860edf215a218abf57a65065ef476a3184dc', class: "focus-info" }, "Focused: ", focusState.isFocused ? 'Yes' : 'No', " | Focus Count: ", focusState.focusCount, " | Blur Count:", ' ', focusState.blurCount)));
    }
    get el() { return this; }
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
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), TextInputCmp);
            }
            break;
    } });
}

export { TextInputCmp as T, defineCustomElement as d };
