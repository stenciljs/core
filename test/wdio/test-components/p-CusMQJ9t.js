import { p as proxyCustomElement, e as createEvent, h, t as transformTag } from './p-DYdAJnXF.js';
import { R as ReactiveControllerHost, V as ValidationController, F as FocusController } from './p-BeF4DdtY.js';

const CheckboxGroupCmp = /*@__PURE__*/ proxyCustomElement(class CheckboxGroupCmp extends ReactiveControllerHost {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.valueChange = createEvent(this, "valueChange");
        this.values = [];
        this.helperText = 'Select at least one option';
        // Controllers via composition
        this.validation = new ValidationController(this);
        this.focus = new FocusController(this);
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
            this.validation.validate(this.values);
        };
        this.handleFocus = () => {
            this.focus.handleFocus();
        };
        this.handleBlur = () => {
            this.focus.handleBlur();
            this.validation.handleBlur(this.values);
        };
    }
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
    render() {
        const focusState = this.focus.getFocusState();
        const validationData = this.validation.getValidationMessageData(this.helperTextId, this.errorTextId);
        return (h("div", { key: 'fca31132ae9725820f82bf02a7f95093347da7ae', class: "checkbox-group-container" }, h("label", { key: 'd3d88c751cad7b429551e4bfaf0c2543f5188fdd' }, "Select Options"), h("div", { key: '123704caa607c6ae3272cb1cd00b73b2ae147dbd', class: "checkbox-group", tabindex: "0", onFocus: this.handleFocus, onBlur: this.handleBlur }, h("label", { key: '1d30c9dc2616e94e5b18c83602dc1b98137b5661' }, h("input", { key: '752d1c96d21164b42dc7fb517c41b0985823afa6', type: "checkbox", name: this.inputId, value: "option1", checked: this.values.includes('option1'), onChange: this.handleChange }), "Option 1"), h("label", { key: 'fba14982025ada49e88613e512fc23e03d157b34' }, h("input", { key: '50bd7bd351977793fa1c88fdef8b351c55dadcd8', type: "checkbox", name: this.inputId, value: "option2", checked: this.values.includes('option2'), onChange: this.handleChange }), "Option 2"), h("label", { key: 'c1d126e20f625fd0fc043194f3802b6d20f88a5b' }, h("input", { key: 'ffc766fd9299c101864da9d7f619c68ca6264c55', type: "checkbox", name: this.inputId, value: "option3", checked: this.values.includes('option3'), onChange: this.handleChange }), "Option 3")), validationData.hasError && (h("div", { key: 'c5ec312c1fd8e7f62dffcf9d78857a474a943881', class: "validation-message" }, h("div", { key: '6231b8bae4c376950dd92bcac075da6296974651', id: validationData.errorTextId, class: "error-text" }, validationData.errorMessage))), h("div", { key: '55373b408bf054187e55eae58ec38fac1277627b', class: "focus-info" }, "Focused: ", focusState.isFocused ? 'Yes' : 'No', " | Focus Count: ", focusState.focusCount, " | Blur Count:", ' ', focusState.blurCount)));
    }
    get el() { return this; }
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
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CheckboxGroupCmp);
            }
            break;
    } });
}

export { CheckboxGroupCmp as C, defineCustomElement as d };
