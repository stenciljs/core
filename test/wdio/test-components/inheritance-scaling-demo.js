import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$4 } from './p-BtgNUsEX.js';
import { d as defineCustomElement$3 } from './p-KM9Uf4vB.js';
import { d as defineCustomElement$2 } from './p-BF6TBGDr.js';

const InheritanceScalingDemo$1 = /*@__PURE__*/ proxyCustomElement(class InheritanceScalingDemo extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: '532ea103007077a4c1142e24ae3e4de2331dacae', class: "demo-container" }, h("h1", { key: '5d33a9b2109d71f1c364b6b9677e5ce8c30108ef' }, "Inheritance-Based Scaling Demo"), h("p", { key: '3ef7bc32dddfd2a6a7d966eb6093ac4cf99366f4' }, "This demo shows 3 components (TextInput, RadioGroup, CheckboxGroup) using 2 controllers (ValidationController, FocusController) via inheritance."), h("div", { key: '145717b76b6fded0c7bea7d2edcd945585f22c34', class: "component-section" }, h("h2", { key: 'b07f1442d5cf58bcf8dff10e0682896230609f96' }, "Text Input Component"), h("inheritance-text-input", { key: 'c3fd7f8208469f9eca019d7a1b2cf704ff71360a' })), h("div", { key: '6eb0e4ef216f74a6566368ea3118cd95b0a598d9', class: "component-section" }, h("h2", { key: '22fe41bbb4119cf43ba0ba53574fe0665eaa8912' }, "Radio Group Component"), h("inheritance-radio-group", { key: '2eaf3b2335352d3bf9c89c05377ebb117696689a' })), h("div", { key: '3b8df37a747beee751ecae9d7282429343058088', class: "component-section" }, h("h2", { key: '20a0e943cc37f8fa16bf7f238045b476855e6dd8' }, "Checkbox Group Component"), h("inheritance-checkbox-group", { key: '8a4cd05845bec2edd8c5ae88f4c6aee05ddf6312' }))));
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
}, [0, "inheritance-scaling-demo"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["inheritance-scaling-demo", "inheritance-checkbox-group", "inheritance-radio-group", "inheritance-text-input"];
    components.forEach(tagName => { switch (tagName) {
        case "inheritance-scaling-demo":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), InheritanceScalingDemo$1);
            }
            break;
        case "inheritance-checkbox-group":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$4();
            }
            break;
        case "inheritance-radio-group":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$3();
            }
            break;
        case "inheritance-text-input":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const InheritanceScalingDemo = InheritanceScalingDemo$1;
const defineCustomElement = defineCustomElement$1;

export { InheritanceScalingDemo, defineCustomElement };
