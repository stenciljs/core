import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const ConditionalBasic$1 = /*@__PURE__*/ proxyCustomElement(class ConditionalBasic extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.showContent = false;
    }
    testClick() {
        this.showContent = !this.showContent;
    }
    render() {
        return (h("div", { key: '597574937377579e0115b1454c93d06a258619b0' }, h("button", { key: 'dec18c28aa8d1d206a158119a3967fd66fc2432c', onClick: this.testClick.bind(this), class: "test" }, "Test"), h("div", { key: '7ed23474a24c5c8a6c6c13ea66f3e87cbba7abfb', class: "results" }, this.showContent ? 'Content' : '')));
    }
}, [0, "conditional-basic", {
        "showContent": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["conditional-basic"];
    components.forEach(tagName => { switch (tagName) {
        case "conditional-basic":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ConditionalBasic$1);
            }
            break;
    } });
}

const ConditionalBasic = ConditionalBasic$1;
const defineCustomElement = defineCustomElement$1;

export { ConditionalBasic, defineCustomElement };
