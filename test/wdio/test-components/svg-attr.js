import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const SvgAttr$1 = /*@__PURE__*/ proxyCustomElement(class SvgAttr extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.isOpen = false;
    }
    testClick() {
        this.isOpen = !this.isOpen;
    }
    render() {
        return (h("div", { key: '4fd873db58e24e600a91d61c7776a58c50cc4e33' }, h("div", { key: '90b2b0ee4b19acc513fa75a7997cf808c6c6b35d' }, h("button", { key: '19c3f0e6dc5e735e1ab026e17b7edf8438e44dec', onClick: this.testClick.bind(this) }, "Test")), h("div", { key: '1ab2a0987edb52ebdad1ef1d65036af4a30999ae' }, this.isOpen ? (h("svg", { viewBox: "0 0 54 54" }, h("rect", { transform: "rotate(45 27 27)", y: "22", width: "54", height: "10", rx: "2", stroke: "yellow", "stroke-width": "5px", "stroke-dasharray": "8 4" }))) : (h("svg", { viewBox: "0 0 54 54" }, h("rect", { y: "0", width: "54", height: "10", rx: "2", stroke: "blue", "stroke-width": "2px", "stroke-dasharray": "4 2" }))))));
    }
}, [0, "svg-attr", {
        "isOpen": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["svg-attr"];
    components.forEach(tagName => { switch (tagName) {
        case "svg-attr":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SvgAttr$1);
            }
            break;
    } });
}

const SvgAttr = SvgAttr$1;
const defineCustomElement = defineCustomElement$1;

export { SvgAttr, defineCustomElement };
