import { t as transformTag, p as proxyCustomElement, H, e as createEvent, h, d as Host } from './p-DYdAJnXF.js';

const radioGroupCss = () => `${transformTag("ion-radio-group")}{display:block}.helper-text{display:block}.error-text{display:none}`;

const TestRadioGroup = /*@__PURE__*/ proxyCustomElement(class TestRadioGroup extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.ionChange = createEvent(this, "ionChange");
        this.ionValueChange = createEvent(this, "ionValueChange");
        this.inputId = `ion-rg-${radioGroupIds++}`;
        this.helperTextId = `${this.inputId}-helper-text`;
        this.errorTextId = `${this.inputId}-error-text`;
        /**
         * If `true`, the radios can be deselected.
         */
        this.allowEmptySelection = false;
        /**
         * The name of the control, which is submitted with the form data.
         */
        this.name = this.inputId;
        this.onClick = (ev) => {
            ev.preventDefault();
            /**
             * The Radio Group component mandates that only one radio button
             * within the group can be selected at any given time. Since `ion-radio`
             * is a shadow DOM component, it cannot natively perform this behavior
             * using the `name` attribute.
             */
            const selectedRadio = ev.target && ev.target.closest(`${transformTag("ion-radio")}`);
            /**
             * Our current disabled prop definition causes Stencil to mark it
             * as optional. While this is not desired, fixing this behavior
             * in Stencil is a significant breaking change, so this effort is
             * being de-risked in STENCIL-917. Until then, we compromise
             * here by checking for falsy `disabled` values instead of strictly
             * checking `disabled === false`.
             */
            if (selectedRadio) {
                const currentValue = this.value;
                const newValue = selectedRadio.value;
                if (newValue !== currentValue) {
                    this.value = newValue;
                    this.emitValueChange(ev);
                }
                else if (this.allowEmptySelection) {
                    this.value = undefined;
                    this.emitValueChange(ev);
                }
            }
        };
        this.setRadioTabindex = (value) => {
            const radios = this.getRadios();
            // Get the first radio that is not disabled and the checked one
            const first = radios.find((radio) => radio);
            const checked = radios.find((radio) => radio.value === value);
            if (!first && !checked) {
                return;
            }
            // If an enabled checked radio exists, set it to be the focusable radio
            // otherwise we default to focus the first radio
            const focusable = checked || first;
            for (const radio of radios) {
                const tabindex = radio === focusable ? 0 : -1;
                radio.setButtonTabindex(tabindex);
            }
        };
    }
    valueChanged(value) {
        this.setRadioTabindex(value);
        this.ionValueChange.emit({ value });
    }
    emitValueChange(event) {
        const { value } = this;
        this.ionChange.emit({ value, event });
    }
    getRadios() {
        return Array.from(this.el.querySelectorAll(`${transformTag("ion-radio")}`));
    }
    /**
     * Renders the helper text or error text values
     * @returns The helper text or error text values.
     */
    renderHintText() {
        const { helperText, errorText, helperTextId, errorTextId } = this;
        const hasHintText = !!helperText || !!errorText;
        if (!hasHintText) {
            return;
        }
        return (h("div", { class: "radio-group-top" }, h("div", { id: helperTextId, class: "helper-text" }, helperText), h("div", { id: errorTextId, class: "error-text" }, errorText)));
    }
    render() {
        return (h(Host, { key: 'b12e4e2949b2dd13fbf05f8bbfb8185c2b2882ad', role: "radiogroup", onClick: this.onClick }, this.renderHintText(), h("slot", { key: '0af6598b6fc9afda02bae034481f641f5ba173ec' })));
    }
    get el() { return this; }
    static get watchers() { return {
        "value": [{
                "valueChanged": 0
            }]
    }; }
    static get style() { return radioGroupCss(); }
}, [260, "ion-radio-group", {
        "allowEmptySelection": [4, "allow-empty-selection"],
        "compareWith": [1, "compare-with"],
        "name": [1],
        "value": [1032],
        "helperText": [1, "helper-text"],
        "errorText": [1, "error-text"]
    }, undefined, {
        "value": [{
                "valueChanged": 0
            }]
    }]);
let radioGroupIds = 0;
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["ion-radio-group"];
    components.forEach(tagName => { switch (tagName) {
        case "ion-radio-group":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), TestRadioGroup);
            }
            break;
    } });
}

export { TestRadioGroup as T, defineCustomElement as d };
