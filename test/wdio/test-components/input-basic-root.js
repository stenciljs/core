import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const InputBasicRoot$1 = /*@__PURE__*/ proxyCustomElement(class InputBasicRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: '3a0c222b34d0f58f107f42ba068b889f93d6259a' }, h("p", { key: '6ad713387c4abb8b36c3af381ba9a23f7418ddea' }, "Value: ", h("span", { key: 'f9437d6a27e797e0a03200aed3c584b5619397a7', class: "value" }, this.value)), h("input", { key: '2855573dbbe6d7704dca49216cba70bfad683c1e', type: "text", value: this.value, onInput: (ev) => (this.value = ev.target.value) })));
    }
    get el() { return this; }
}, [0, "input-basic-root", {
        "value": [1025]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["input-basic-root"];
    components.forEach(tagName => { switch (tagName) {
        case "input-basic-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), InputBasicRoot$1);
            }
            break;
    } });
}

const InputBasicRoot = InputBasicRoot$1;
const defineCustomElement = defineCustomElement$1;

export { InputBasicRoot, defineCustomElement };
