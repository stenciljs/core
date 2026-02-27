import { p as proxyCustomElement, H, t as transformTag, h } from './p-DYdAJnXF.js';
import { d as defineCustomElement$3 } from './p-C4zYi_h2.js';
import { d as defineCustomElement$2 } from './p-F_jQ77Rc.js';

const RadioGroupBlurTest$1 = /*@__PURE__*/ proxyCustomElement(class RadioGroupBlurTest extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.blurCount = 0;
        this.componentDidLoad = () => {
            setTimeout(() => {
                // The issue: blue is called on focus of the first radio only reproduces
                // when the radios are dynamically added with a timeout
                const radioGroup = document.getElementById('radio-group');
                for (let i = 0; i < 3; i++) {
                    const radio = document.createElement(transformTag('ion-radio'));
                    radio.value = `radio-${i}`;
                    radio.textContent = `Radio ${i}`;
                    radioGroup === null || radioGroup === void 0 ? void 0 : radioGroup.appendChild(radio);
                }
            }, 100);
            // listen for radio `ionBlur` on all radios
            document.addEventListener('ionBlur', () => {
                this.blurCount++;
            });
        };
    }
    render() {
        return (h("div", { key: '26310d9d56eaa20225cd8804de06ab9095aadfd9' }, h("h1", { key: '7db65a3d680b02b0366b8b50c4983936ae8061aa' }, "Radio Group Blur Test"), h("p", { key: 'd34abdc4386214ddffa0ff9532d9373395591889' }, "Blur Count: ", h("span", { key: '439257e516c4e4e4bd285e551a1b50f8551f1ecb', id: "blur-count" }, this.blurCount)), h("ion-radio-group", { key: 'c6a445e0c4666beb9fb015725fb99c7111f22aa8', id: "radio-group" })));
    }
    get el() { return this; }
}, [0, "radio-group-blur-test", {
        "blurCount": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["radio-group-blur-test", "ion-radio", "ion-radio-group"];
    components.forEach(tagName => { switch (tagName) {
        case "radio-group-blur-test":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), RadioGroupBlurTest$1);
            }
            break;
        case "ion-radio":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$3();
            }
            break;
        case "ion-radio-group":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const RadioGroupBlurTest = RadioGroupBlurTest$1;
const defineCustomElement = defineCustomElement$1;

export { RadioGroupBlurTest, defineCustomElement };
