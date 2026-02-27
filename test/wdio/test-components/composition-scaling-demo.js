import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$4 } from './p-CusMQJ9t.js';
import { d as defineCustomElement$3 } from './p-BkYfcVzb.js';
import { d as defineCustomElement$2 } from './p-CVSuGeub.js';

const CompositionScalingDemo$1 = /*@__PURE__*/ proxyCustomElement(class CompositionScalingDemo extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: '858226cf767c1e53c59c9f214030305c90e3ce63', class: "demo-container" }, h("h1", { key: 'a7f70cf246ae4b6d71b5239df2a713f193fa1bf7' }, "Composition-Based Scaling Demo"), h("p", { key: '38b4120312861217a01f8d26cb6f15ce36edd666' }, "This demo shows 3 components (TextInput, RadioGroup, CheckboxGroup) using 2 controllers (ValidationController, FocusController) via composition."), h("div", { key: '287ad888ba0477e5948eb88d69581ac68c686347', class: "component-section" }, h("h2", { key: 'c0b415fd1f208240ee4eef53cb32ba82762a5524' }, "Text Input Component"), h("composition-text-input", { key: '04d0f8b8b04ade1549515b6a6034d554070dfef6' })), h("div", { key: 'ddea81eeb70a69e2cf703fb248788c48598c8b8a', class: "component-section" }, h("h2", { key: '559523b48b5ceb97f918337c9517dd17463d1cdb' }, "Radio Group Component"), h("composition-radio-group", { key: 'ddf0af8c7d9584e5ca6ba27e3f9df362d35268ea' })), h("div", { key: '48c693084bae37b99fcdba35948ef098d1e5c84a', class: "component-section" }, h("h2", { key: '6939b1452f4637fb11c377bdeb7d2cd99f946704' }, "Checkbox Group Component"), h("composition-checkbox-group", { key: '3dd85e61472316259cbfb9dd2164ec141225a5dd' }))));
    }
    static get style() { return `:host {
      display: block;
      padding: 20px;
      font-family: Arial, sans-serif;
    }

    .demo-container {
      max-width: 600px;
      margin: 0 auto;
    }

    .component-section {
      margin: 30px 0;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .text-input-container,
    .radio-group-container,
    .checkbox-group-container {
      margin: 10px 0;
    }

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: bold;
    }

    input[type='text'] {
      width: 100%;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-sizing: border-box;
    }

    input[type='text'].invalid {
      border-color: #f00;
    }

    .radio-group,
    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .radio-group label,
    .checkbox-group label {
      display: flex;
      align-items: center;
      font-weight: normal;
      cursor: pointer;
    }

    .radio-group input[type='radio'],
    .checkbox-group input[type='checkbox'] {
      margin-right: 8px;
    }

    .validation-message {
      margin-top: 8px;
    }

    .error-text {
      color: #f00;
      font-size: 0.875em;
    }

    .focus-info {
      margin-top: 8px;
      font-size: 0.875em;
      color: #666;
    }

    h1 {
      text-align: center;
      color: #333;
    }

    h2 {
      color: #555;
      margin-top: 0;
    }`; }
}, [0, "composition-scaling-demo"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["composition-scaling-demo", "composition-checkbox-group", "composition-radio-group", "composition-text-input"];
    components.forEach(tagName => { switch (tagName) {
        case "composition-scaling-demo":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CompositionScalingDemo$1);
            }
            break;
        case "composition-checkbox-group":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$4();
            }
            break;
        case "composition-radio-group":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$3();
            }
            break;
        case "composition-text-input":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const CompositionScalingDemo = CompositionScalingDemo$1;
const defineCustomElement = defineCustomElement$1;

export { CompositionScalingDemo, defineCustomElement };
