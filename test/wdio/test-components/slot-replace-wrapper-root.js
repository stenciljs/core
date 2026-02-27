import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-Bjd6XbkX.js';

const SlotReplaceWrapperRoot$1 = /*@__PURE__*/ proxyCustomElement(class SlotReplaceWrapperRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    componentDidLoad() {
        this.href = 'http://stenciljs.com/';
    }
    render() {
        return (h("main", { key: 'e605d46161a94e17acaba4b2efafe47394d56a2e' }, h("slot-replace-wrapper", { key: 'b435151791c7880f440627c83fc60cf66f807bc5', href: this.href, class: "results1" }, h("content-end", { key: '1b06dadd05364b656eb83625134658a57f2071e2', slot: "start" }, "A")), h("slot-replace-wrapper", { key: '0bb631246e474d7d59a8dc4590ce524d363ec3c1', href: this.href, class: "results2" }, h("content-end", { key: '4d1b3e25a595cf12a7c6bb1c71e75e5e1668d62c' }, "B")), h("slot-replace-wrapper", { key: 'f2aab859aaf5655ecf41d3259a2059732fb37a8f', href: this.href, class: "results3" }, h("content-end", { key: '8b7911d14d340651fbc231dd2b28217e1c4e5ea8', slot: "end" }, "C")), h("slot-replace-wrapper", { key: 'ed07fbbc2d8c11b2460d7a92fc549334bbae31cc', href: this.href, class: "results4" }, h("content-start", { key: 'f28a884884ae3fd6db41fbf70d1eebda4ec52314', slot: "start" }, "A"), h("content-default", { key: 'e41defb0978cc9509d56f8333988e195d5f70665' }, "B"), h("content-end", { key: '4b90ee2c89dfe05c45ad24ed25a2c16bd711b0e4', slot: "end" }, "C")), h("slot-replace-wrapper", { key: '7c3d5158bfab0c9000ba79cde2635999293535a3', href: this.href, class: "results5" }, h("content-default", { key: 'd964af4cc8f0c811aad2da06b4dedb5f1278d976' }, "B"), h("content-end", { key: '79e6f093e3bc1b7439847a96752a1cfa00d67b38', slot: "end" }, "C"), h("content-start", { key: 'c88187d48c03b85d0787be1a9de0d6f7abdf1593', slot: "start" }, "A")), h("slot-replace-wrapper", { key: 'e8e5141ee67d57a0358a8b7053dad7224288be84', href: this.href, class: "results6" }, h("content-end", { key: '014b819f830593f3bc7ff58a2481a2455f9545d4', slot: "end" }, "C"), h("content-start", { key: '5ad39336a4786e841efb810ca75cc40c21c3690b', slot: "start" }, "A"), h("content-default", { key: '062732f9084e511483417aca2ece5cf8cb7faf50' }, "B")), h("slot-replace-wrapper", { key: 'b121f8860d2c2abb76e557e1ac0cfd6b749729c7', href: this.href, class: "results7" }, h("content-start", { key: '337e9e729cea6887f5c135082a531464ef6c3fc4', slot: "start" }, "A1"), h("content-start", { key: '7f4014a2f8d930c13d5c35f3a5c5bf2528548bb9', slot: "start" }, "A2"), h("content-default", { key: 'e5bd41ca03ead5dc62c06a650d3d2a04fb0e9075' }, "B1"), h("content-default", { key: 'dd19383e2e761de1cb3600eb602c220a7498924f' }, "B2"), h("content-end", { key: 'fcb517b511e7b99ae8caa9cf43ae6e4431f923e2', slot: "end" }, "C1"), h("content-end", { key: 'eed13c1041abd6f4508ec311bbb7e61902c32c93', slot: "end" }, "C2")), h("slot-replace-wrapper", { key: '648d70286f329c3de667e4c2aeb75b674300e106', href: this.href, class: "results8" }, h("content-default", { key: 'e15baf2123902fd2093cb2e051c2b263262d7e1b' }, "B1"), h("content-end", { key: 'a341a6307a17f4f3ab477083b2543507f30f1f38', slot: "end" }, "C1"), h("content-start", { key: 'e48607582cd32e7470a9eaced4f2237eb3acc97a', slot: "start" }, "A1"), h("content-default", { key: 'fcc235ca397d19d00e53b18fc3c2c684d7432f3b' }, "B2"), h("content-end", { key: 'f870932b4b085e6b92d6638d6cbd5aef354ec04c', slot: "end" }, "C2"), h("content-start", { key: '92903139c8506acd1f5ccd54c0959d9cc28e46d1', slot: "start" }, "A2"))));
    }
}, [0, "slot-replace-wrapper-root", {
        "href": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-replace-wrapper-root", "slot-replace-wrapper"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-replace-wrapper-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotReplaceWrapperRoot$1);
            }
            break;
        case "slot-replace-wrapper":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const SlotReplaceWrapperRoot = SlotReplaceWrapperRoot$1;
const defineCustomElement = defineCustomElement$1;

export { SlotReplaceWrapperRoot, defineCustomElement };
