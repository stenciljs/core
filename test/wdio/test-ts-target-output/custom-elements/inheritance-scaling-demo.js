import { t as transformTag, p as proxyCustomElement, H, h } from './index.js';
import { d as defineCustomElement$4 } from './p-DTzFmaP6.js';
import { d as defineCustomElement$3 } from './p-Cr9h9Vde.js';
import { d as defineCustomElement$2 } from './p-CXvEULZN.js';

const InheritanceScalingDemo$1 = /*@__PURE__*/ proxyCustomElement(class InheritanceScalingDemo extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: '62225dee7461dc8b0887e5b215a5c41d47859c0b', class: "demo-container" }, h("h1", { key: 'dd8b0b85962941f0cad75f55b25c887ad952f848' }, "Inheritance-Based Scaling Demo"), h("p", { key: '3d551c36b0ce58887735e11ae816929b69411153' }, "This demo shows 3 components (TextInput, RadioGroup, CheckboxGroup) using 2 controllers (ValidationController, FocusController) via inheritance."), h("div", { key: 'df9172c2338dd60ebf7ec39a387ca2624a170ea8', class: "component-section" }, h("h2", { key: '19c98982b25aaf25e248478cc41e18f01ec67394' }, "Text Input Component"), h("inheritance-text-input", { key: '9b5dff50d3a891e8c6e4c8f35aec1b400f4d74b3' })), h("div", { key: 'b84453573898888641d7b26d9b8bf557cd811a61', class: "component-section" }, h("h2", { key: '6cf30e0fdf3e3fc7fbcf45ba9ecaaac510b0486c' }, "Radio Group Component"), h("inheritance-radio-group", { key: '0f94f9204fea1ce4bc903bd2f7ea06f62a5a1d48' })), h("div", { key: 'b48ed6b130dcdd570d106eefe4a24037298d75f3', class: "component-section" }, h("h2", { key: '987bba30e71772dcde4e609446026ce4ff39e1f7' }, "Checkbox Group Component"), h("inheritance-checkbox-group", { key: '76edcf98fd68733647bd44ba284f24b3a0f7fb73' }))));
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
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), InheritanceScalingDemo$1);
            }
            break;
        case "inheritance-checkbox-group":
            if (!customElements.get(transformTag(tagName))) {
                defineCustomElement$4();
            }
            break;
        case "inheritance-radio-group":
            if (!customElements.get(transformTag(tagName))) {
                defineCustomElement$3();
            }
            break;
        case "inheritance-text-input":
            if (!customElements.get(transformTag(tagName))) {
                defineCustomElement$2();
            }
            break;
    } });
}
defineCustomElement$1();

const InheritanceScalingDemo = InheritanceScalingDemo$1;
const defineCustomElement = defineCustomElement$1;

export { InheritanceScalingDemo, defineCustomElement };
//# sourceMappingURL=inheritance-scaling-demo.js.map

//# sourceMappingURL=inheritance-scaling-demo.js.map