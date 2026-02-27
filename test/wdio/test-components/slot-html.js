import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const SlotHtml$1 = /*@__PURE__*/ proxyCustomElement(class SlotHtml extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.inc = 0;
    }
    render() {
        return (h("div", { key: 'd92bd12de8bf4fd814c7c7d3c98f9018757c13e0' }, h("hr", { key: '6b53fdd4a4b1907594abe3df2283d4a8e27ab1c7' }), h("article", { key: 'f364d2d8ab38a083fafaff6c6d2d38c1804d1656' }, h("span", { key: 'dfb2b69afe6189636ae16cdf1da44d01dff0fcad' }, h("slot", { key: '5b8ade4ac84effd3a76a382f250c65a85fd1049d', name: "start" }))), h("slot", { key: '8fc1578e74e459cea1d0b9472012b7ad92b74f52' }), h("section", { key: '5e6303eaf00dc16da7a5372763912e2c4c18b7cc' }, h("slot", { key: '9dfc8284ef28467db253002c7c55dac9b26feba0', name: "end" }))));
    }
}, [260, "slot-html", {
        "inc": [2]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-html"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-html":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotHtml$1);
            }
            break;
    } });
}

const SlotHtml = SlotHtml$1;
const defineCustomElement = defineCustomElement$1;

export { SlotHtml, defineCustomElement };
