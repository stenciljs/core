import { p as proxyCustomElement, H, e as createEvent, t as transformTag, h, d as Host } from './p-DYdAJnXF.js';

const addEventListener = (el, eventName, callback, opts) => {
    var _a;
    if (typeof window !== 'undefined') {
        const win = window;
        const config = (_a = win === null || win === void 0 ? void 0 : win.Ionic) === null || _a === void 0 ? void 0 : _a.config;
        if (config) {
            const ael = config.get('_ael');
            if (ael) {
                return ael(el, eventName, callback, opts);
            }
            else if (config._ael) {
                return config._ael(el, eventName, callback, opts);
            }
        }
    }
    return el.addEventListener(eventName, callback, opts);
};
const removeEventListener = (el, eventName, callback, opts) => {
    var _a;
    if (typeof window !== 'undefined') {
        const win = window;
        const config = (_a = win === null || win === void 0 ? void 0 : win.Ionic) === null || _a === void 0 ? void 0 : _a.config;
        if (config) {
            const rel = config.get('_rel');
            if (rel) {
                return rel(el, eventName, callback, opts);
            }
            else if (config._rel) {
                return config._rel(el, eventName, callback, opts);
            }
        }
    }
    return el.removeEventListener(eventName, callback, opts);
};
/**
 * Uses the compareWith param to compare two values to determine if they are equal.
 *
 * @param currentValue The current value of the control.
 * @param compareValue The value to compare against.
 * @param compareWith The function or property name to use to compare values.
 * @returns True if the values are equal, false otherwise.
 */
const compareOptions = (currentValue, compareValue, compareWith) => {
    if (typeof compareWith === 'function') {
        return compareWith(currentValue, compareValue);
    }
    else if (typeof compareWith === 'string') {
        return currentValue[compareWith] === compareValue[compareWith];
    }
    else {
        return Array.isArray(compareValue) ? compareValue.includes(currentValue) : currentValue === compareValue;
    }
};
/**
 * Compares a value against the current value(s) to determine if it is selected.
 *
 * @param currentValue The current value of the control.
 * @param compareValue The value to compare against.
 * @param compareWith The function or property name to use to compare values.
 * @returns True if the value is selected, false otherwise.
 */
const isOptionSelected = (currentValue, compareValue, compareWith) => {
    if (currentValue === undefined) {
        return false;
    }
    if (Array.isArray(currentValue)) {
        return currentValue.some((val) => compareOptions(val, compareValue, compareWith));
    }
    else {
        return compareOptions(currentValue, compareValue, compareWith);
    }
};

const radioCss = () => `:host{display:block;position:relative;max-width:100%;min-height:40px;cursor:pointer;user-select:none;box-sizing:border-box}:host(.radio-disabled){pointer-events:none}.radio-icon{display:flex;align-items:center;justify-content:center;width:28px;height:28px;contain:layout size style}.radio-icon,.radio-inner{box-sizing:border-box}input{}.radio-wrapper{display:flex;position:relative;flex-grow:1;align-items:center;justify-content:space-between;height:inherit;min-height:inherit;cursor:inherit}.label-text-wrapper{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.native-wrapper{display:flex;align-items:center}.radio-icon{margin:0;border-radius:999px;border:1px solid #ccc}.radio-inner{border-radius:999px;width:calc(50% + 1px);height:calc(50% + 1px);transform:scale3d(0, 0, 0);transition:transform 280ms cubic-bezier(.4, 0, .2, 1);background:#177fff}:host(.radio-checked) .radio-icon{border-color:#177fff}:host(.radio-checked) .radio-inner{transform:scale3d(1, 1, 1)}`;

const Radio = /*@__PURE__*/ proxyCustomElement(class Radio extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
        this.ionFocus = createEvent(this, "ionFocus");
        this.ionBlur = createEvent(this, "ionBlur");
        this.inputId = `ion-rb-${radioButtonIds++}`;
        this.radioGroup = null;
        /**
         * If `true`, the radio is selected.
         */
        this.checked = false;
        /**
         * The tabindex of the radio button.
         * @internal
         */
        this.buttonTabindex = -1;
        /**
         * The name of the control, which is submitted with the form data.
         */
        this.name = this.inputId;
        this.updateState = () => {
            if (this.radioGroup) {
                const { compareWith, value: radioGroupValue } = this.radioGroup;
                this.checked = isOptionSelected(radioGroupValue, this.value, compareWith);
            }
        };
        this.onClick = () => {
            this.checked = true;
        };
        this.onFocus = () => {
            this.ionFocus.emit();
        };
        this.onBlur = () => {
            this.ionBlur.emit();
        };
    }
    valueChanged() {
        /**
         * The new value of the radio may
         * match the radio group's value,
         * so we see if it should be checked.
         */
        this.updateState();
    }
    componentDidLoad() {
        /**
         * The value may be `undefined` if it
         * gets set before the radio is
         * rendered. This ensures that the radio
         * is checked if the value matches. This
         * happens most often when Angular is
         * rendering the radio.
         */
        this.updateState();
    }
    async setFocus(ev) {
        if (ev !== undefined) {
            ev.stopPropagation();
            ev.preventDefault();
        }
        this.el.focus();
    }
    async setButtonTabindex(value) {
        this.buttonTabindex = value;
    }
    connectedCallback() {
        if (this.value === undefined) {
            this.value = this.inputId;
        }
        const radioGroup = (this.radioGroup = this.el.closest(`${transformTag("ion-radio-group")}`));
        if (radioGroup) {
            this.updateState();
            addEventListener(radioGroup, 'ionValueChange', this.updateState);
        }
    }
    disconnectedCallback() {
        const radioGroup = this.radioGroup;
        if (radioGroup) {
            removeEventListener(radioGroup, 'ionValueChange', this.updateState);
            this.radioGroup = null;
        }
    }
    renderRadioControl() {
        return (h("div", { class: "radio-icon", part: "container" }, h("div", { class: "radio-inner", part: "mark" }), h("div", { class: "radio-ripple" })));
    }
    render() {
        const { checked, buttonTabindex } = this;
        return (h(Host, { key: '464a5ab2bf4ddf93db32fb49b3830440db26ca74', onFocus: this.onFocus, onBlur: this.onBlur, onClick: this.onClick, role: "radio", "aria-checked": checked ? 'true' : 'false', tabindex: buttonTabindex, class: {
                'radio-checked': checked,
            } }, h("label", { key: '156bc841bd3c098c8f2f7bc10d97627ebcd48bc6', class: "radio-wrapper" }, h("div", { key: '2371dc4f0a82709ebbc5e2518323290b665f4ede', class: "label-text-wrapper" }, h("slot", { key: '99e9199366b9de00574c7120a26d908645ce6632' })), h("div", { key: '5a7e66936bbaac05b7ba6fc79461438a3f888545', class: "native-wrapper" }, this.renderRadioControl()))));
    }
    get el() { return this; }
    static get watchers() { return {
        "value": [{
                "valueChanged": 0
            }]
    }; }
    static get style() { return radioCss(); }
}, [257, "ion-radio", {
        "name": [1],
        "value": [8],
        "checked": [32],
        "buttonTabindex": [32],
        "setFocus": [64],
        "setButtonTabindex": [64]
    }, undefined, {
        "value": [{
                "valueChanged": 0
            }]
    }]);
let radioButtonIds = 0;
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["ion-radio"];
    components.forEach(tagName => { switch (tagName) {
        case "ion-radio":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), Radio);
            }
            break;
    } });
}

export { Radio as R, defineCustomElement as d };
