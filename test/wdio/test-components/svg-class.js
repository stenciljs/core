import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const SvgClass$1 = /*@__PURE__*/ proxyCustomElement(class SvgClass extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.hasColor = false;
    }
    testClick() {
        this.hasColor = !this.hasColor;
    }
    render() {
        return (h("div", { key: 'a1425385c4b0146eb83ce51737a57f808c0349a0' }, h("div", { key: '747bb332a363d699f17b5b3bc522d9be969d3b2b' }, h("button", { key: '0802b6c8d58b22d15dd84dc1e6c3b5133393f16f', onClick: this.testClick.bind(this) }, "Test")), h("div", { key: '82c53d0eb4dd4be27d2ba14cf53ad0033a8d68e7' }, h("svg", { key: '4902c8b5b14a85a74df5133e0b478790544138db', viewBox: "0 0 54 54", class: this.hasColor ? 'primary' : undefined }, h("circle", { key: '837570330444e8730e9ccd9aa93ad6cbc74185ce', cx: "8", cy: "18", width: "54", height: "8", r: "2", class: this.hasColor ? 'red' : undefined }), h("rect", { key: 'efbaec7108743039cdf33f137f4fc31e7be79935', y: "2", width: "54", height: "8", rx: "2", class: this.hasColor ? 'blue' : undefined })))));
    }
}, [0, "svg-class", {
        "hasColor": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["svg-class"];
    components.forEach(tagName => { switch (tagName) {
        case "svg-class":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SvgClass$1);
            }
            break;
    } });
}

const SvgClass = SvgClass$1;
const defineCustomElement = defineCustomElement$1;

export { SvgClass, defineCustomElement };
