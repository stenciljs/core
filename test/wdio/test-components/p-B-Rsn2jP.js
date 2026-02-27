import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const Child = /*@__PURE__*/ proxyCustomElement(class Child extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: 'a0104beb62129263fa2ba2779a9b63f75bf290ac', style: { display: 'flex', gap: '13px' } }, h("slot", { key: '77106119287f215a019c1728e3cd29bc6f5a5ee7', name: "suffix" })));
    }
}, [262, "ion-child"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["ion-child"];
    components.forEach(tagName => { switch (tagName) {
        case "ion-child":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), Child);
            }
            break;
    } });
}

export { Child as C, defineCustomElement as d };
