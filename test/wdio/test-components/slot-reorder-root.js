import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-Dzq-_Hb3.js';

const SlotReorderRoot$1 = /*@__PURE__*/ proxyCustomElement(class SlotReorderRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.reordered = false;
    }
    testClick() {
        this.reordered = !this.reordered;
    }
    render() {
        return (h("div", { key: 'ae9c9e867d65a35d027c21e5620f18525eb40c7a' }, h("button", { key: '2daa2d1ce95cf6a61a11cf8989348faf9d91d6bb', onClick: this.testClick.bind(this), class: "test" }, "Test"), h("slot-reorder", { key: '73ea9abe323f691004b782dd731586deda941c21', class: "results1", reordered: this.reordered }), h("hr", { key: '0bb0b239b2295cfe3e2028c812ff5e8d1a6af28a' }), h("slot-reorder", { key: 'cef60ab2cc39057832834c247f094408be15a1bb', class: "results2", reordered: this.reordered }, h("div", { key: '7f319e381d2fb447f548466e65f68c6879755feb' }, "default content")), h("hr", { key: '275fa0a0ecbdb00df3b0e3d6b2b55fd6db7583e5' }), h("slot-reorder", { key: '85e2a3a76d2fbf49b4e12f754ca519a251b9f7bb', class: "results3", reordered: this.reordered }, h("div", { key: 'ea96cf918afda587b77af5863a21089d89c3f7d2', slot: "slot-b" }, "slot-b content"), h("div", { key: '43acd229760301a989cc07c0f08bf9a1da3d0b52' }, "default content"), h("div", { key: '0625d2a371721cbdbafa9cc55509c55e60186dd6', slot: "slot-a" }, "slot-a content")), h("hr", { key: '963400f1bc8197cfcce1664e789922e311155c18' }), h("slot-reorder", { key: 'bba205ae8202df29ba16ab0a2103b986fe202d60', class: "results4", reordered: this.reordered }, h("div", { key: 'b7111b06ada0084a9f2a7939cd5ed57c167ae8e0', slot: "slot-b" }, "slot-b content"), h("div", { key: 'db02fd952ad9965c5581310356a2343fc483f78a', slot: "slot-a" }, "slot-a content"), h("div", { key: '123ceedfc0f6924314087fb9d38bed352954fb60' }, "default content"))));
    }
}, [0, "slot-reorder-root", {
        "reordered": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-reorder-root", "slot-reorder"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-reorder-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotReorderRoot$1);
            }
            break;
        case "slot-reorder":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const SlotReorderRoot = SlotReorderRoot$1;
const defineCustomElement = defineCustomElement$1;

export { SlotReorderRoot, defineCustomElement };
