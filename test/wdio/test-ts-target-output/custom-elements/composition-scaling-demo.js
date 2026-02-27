import { t as transformTag, p as proxyCustomElement, H, h } from './index.js';
import { d as defineCustomElement$4 } from './p-CLQ7R6uc.js';
import { d as defineCustomElement$3 } from './p-DyoGaahN.js';
import { d as defineCustomElement$2 } from './p-GdfKiTPg.js';

const CompositionScalingDemo$1 = /*@__PURE__*/ proxyCustomElement(class CompositionScalingDemo extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: '45a5c8f6964ed3b0fcb5afa4198650519b02ea41', class: "demo-container" }, h("h1", { key: '066f7128b29b35588196c0804f1dddee7fddc9ca' }, "Composition-Based Scaling Demo"), h("p", { key: 'ea4c2bf3a98f8be6ed4ffe6c26726bd68df08728' }, "This demo shows 3 components (TextInput, RadioGroup, CheckboxGroup) using 2 controllers (ValidationController, FocusController) via composition."), h("div", { key: '877b0f7e0f200ddc4a59890f67b5202061f04ded', class: "component-section" }, h("h2", { key: '779d66fc8599b55d9abf3de4508fd6aabc33aa94' }, "Text Input Component"), h("composition-text-input", { key: 'd42b11bcebc5763177bd5703cae1cd521539234c' })), h("div", { key: 'ae9fc4d8d33be89f1f58e073edaa0472c9d9a188', class: "component-section" }, h("h2", { key: '422445fedbaa1a8ba2f4bb4018c61565ddb22f44' }, "Radio Group Component"), h("composition-radio-group", { key: '21f6decad393f2650144c696ad841bbac3330255' })), h("div", { key: '6740198cb4084d9b138ff5fe7b7f88de0c1e4b74', class: "component-section" }, h("h2", { key: 'c857c83fb61380b8a50d5cdc77262bdaaafb3462' }, "Checkbox Group Component"), h("composition-checkbox-group", { key: '6cfbd8a47d6a7b42163f8aae88aed5877630ab60' }))));
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
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), CompositionScalingDemo$1);
            }
            break;
        case "composition-checkbox-group":
            if (!customElements.get(transformTag(tagName))) {
                defineCustomElement$4();
            }
            break;
        case "composition-radio-group":
            if (!customElements.get(transformTag(tagName))) {
                defineCustomElement$3();
            }
            break;
        case "composition-text-input":
            if (!customElements.get(transformTag(tagName))) {
                defineCustomElement$2();
            }
            break;
    } });
}
defineCustomElement$1();

const CompositionScalingDemo = CompositionScalingDemo$1;
const defineCustomElement = defineCustomElement$1;

export { CompositionScalingDemo, defineCustomElement };
//# sourceMappingURL=composition-scaling-demo.js.map

//# sourceMappingURL=composition-scaling-demo.js.map