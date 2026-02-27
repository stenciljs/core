import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-CoVNSBeg.js';

const SlotLightDomRoot$1 = /*@__PURE__*/ proxyCustomElement(class SlotLightDomRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.a = 'a';
        this.b = 'b';
        this.c = 'c';
        this.d = 'd';
        this.e = 'e';
        this.f = 'f';
        this.g = 'g';
        this.h = 'h';
        this.i = 'i';
        this.j = 'j';
        this.k = 'k';
        this.l = 'l';
        this.m = 'm';
    }
    testClick() {
        this.a = 'A';
        this.b = 'B';
        this.c = 'C';
        this.d = 'D';
        this.e = 'E';
        this.f = 'F';
        this.g = 'G';
        this.h = 'H';
        this.i = 'I';
        this.j = 'J';
        this.k = 'K';
        this.l = 'L';
        this.m = 'M';
    }
    render() {
        return (h("div", { key: 'c4750cf4a5a610badea129b18566daa407cd5e22' }, h("button", { key: '5cf475faddfff5bb047d5367b1c24ada627ebe93', onClick: this.testClick.bind(this) }, "Test"), h("slot-light-dom-content", { key: 'bb3b227f8da002ea9f5719e76e8d57718cfdc86d', class: "results1" }, this.a), h("slot-light-dom-content", { key: 'a9332272315b35587936be1c5ec32f686ba69f34', class: "results2" }, this.b), h("slot-light-dom-content", { key: 'ea0331954517ac98e5673ed095d3402fbc90ce7f', class: "results3" }, h("nav", { key: 'f3a3dc7f12577ad6b6b6bb23e5a5ca4696944f6d' }, this.c)), h("slot-light-dom-content", { key: 'c559db7d558fda3826672cc79b76094e1ddfea53', class: "results4" }, h("nav", { key: '68f5d8049fc4b9276e090c1242a580d3022ca40e' }, this.d), this.e), h("slot-light-dom-content", { key: 'a12590a6961953554c6e7b39db5d64e254ef0221', class: "results5" }, this.f, h("nav", { key: '0692c82702ff98f8447b4e6ca85b48b03d104f45' }, this.g)), h("slot-light-dom-content", { key: '2879c667358614f5b9ac415cf7c78e77869bb306', class: "results6" }, this.h, h("nav", { key: 'e78480065917be627b046766ccfba42a0d893a8f' }, this.i), this.j), h("slot-light-dom-content", { key: '8a434478376b1435e4d3a2c71543df9aa62f8754', class: "results7" }, h("nav", { key: '94c1f610640d9c0f7f2083ccf604ffcd919843d2' }, this.k), h("nav", { key: 'ecf2e566a35927f4f2e91c70782bb20be1b0bae8' }, this.l), h("nav", { key: 'd1858017c775cf2a7c0962bc0254bb3fd869c97c' }, this.m))));
    }
}, [0, "slot-light-dom-root", {
        "a": [32],
        "b": [32],
        "c": [32],
        "d": [32],
        "e": [32],
        "f": [32],
        "g": [32],
        "h": [32],
        "i": [32],
        "j": [32],
        "k": [32],
        "l": [32],
        "m": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-light-dom-root", "slot-light-dom-content"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-light-dom-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotLightDomRoot$1);
            }
            break;
        case "slot-light-dom-content":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const SlotLightDomRoot = SlotLightDomRoot$1;
const defineCustomElement = defineCustomElement$1;

export { SlotLightDomRoot, defineCustomElement };
