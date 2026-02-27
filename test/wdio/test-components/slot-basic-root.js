import { h, p as proxyCustomElement, H, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-CgqCp5Ht.js';

const textA = 'A';
const spanA = h("span", null, "A");
const divA = h("div", null, "A");
const textB = 'B';
const spanB = h("span", null, "B");
const divB = h("div", null, "B");
const divC = h("div", null, "C");
const SlotBasicRoot$1 = /*@__PURE__*/ proxyCustomElement(class SlotBasicRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.inc = 1;
    }
    testClick() {
        this.inc++;
    }
    render() {
        return (h("div", { key: '576630f6453ecedc1b9c68f721879cdd9b18c5b6' }, h("button", { key: '6b61607abdd49700fefba238539ca77bf949e736', onClick: this.testClick.bind(this), class: "test" }, "Test"), h("div", { key: '95e9e0c36165c7ce6fcb5e32874c4d7f8ada5f09', class: "inc" }, "Rendered: ", this.inc), h("div", { key: 'e12da830f33b3f3a15df6129e8cd9199e05852b6', class: "results1" }, h("slot-basic", { key: '2a907fd7df7849808d034521713a8b7e8cfbb928' }, textA, textB)), h("div", { key: '1138fdeecbb322204aab6fe8caafd975a418f5ea', class: "results2" }, h("slot-basic", { key: 'ae3b2944f1996ea2a4d7d63cfac67c3b13bfba6d' }, textA, spanB)), h("div", { key: 'ade298108d50c341af6f6a4904691a78f48f7313', class: "results3" }, h("slot-basic", { key: '2ea58abea5657eb66342172c53930e0e0ed45152' }, textA, divB)), h("div", { key: '942c3ce500dd0cab93af6cafe952330887024e6d', class: "results4" }, h("slot-basic", { key: '0f59a0013a3285002536a0349b2109a890f3bdb4' }, h("footer", { key: 'cab5f6bb525cc843275a3d9716aeb315fe140c28' }, textA, divB))), h("div", { key: 'c3782bc73ed3871d1cc6b5b207b47b8ad7aca6a9', class: "results5" }, h("slot-basic", { key: 'dba3c1d107e002a8782255dc03fc2f54cdbc9273' }, spanA, textB)), h("div", { key: '3f01df67cb67550aacda64f832782646f5649d9e', class: "results6" }, h("slot-basic", { key: 'be7108e6a1f372ab32b767bca2595dec37221adf' }, spanA, spanB)), h("div", { key: 'bcce47d2fbc467e14f4e2e32e16c601be6cf6570', class: "results7" }, h("slot-basic", { key: 'a11c5b1fd7dea2e33921ec33c1b9a464801540c3' }, spanA, divB)), h("div", { key: 'eeefbb0d9b6d18af8a71c0c0f74f1c17149a460b', class: "results8" }, h("slot-basic", { key: '2a408df41a9adfdf25fd07234030fd25613203e1' }, divA, textB)), h("div", { key: '0fec49fee8a4c8fa27ca05073ec79c504f3491f2', class: "results9" }, h("slot-basic", { key: 'cdc1a87ccf2c9a5c7f453fb77403fb088b4c95ad' }, divA, spanB)), h("div", { key: 'e485907bebf16cf58a3bc23eeb3aed11536e88a1', class: "results10" }, h("slot-basic", { key: 'd2767d406937a06623be605cf91e6d36f2d86bba' }, divA, divB)), h("div", { key: 'f3885e59cb28deb107c6370692c9da5bd0d28705', class: "results11" }, h("slot-basic", { key: '854c2cc09ea530bb83e8302db56467143884403c' }, divA, h("footer", { key: '9d69b68ca70b64732165cb671026a8191c579859' }, divB), divC))));
    }
}, [0, "slot-basic-root", {
        "inc": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-basic-root", "slot-basic"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-basic-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotBasicRoot$1);
            }
            break;
        case "slot-basic":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const SlotBasicRoot = SlotBasicRoot$1;
const defineCustomElement = defineCustomElement$1;

export { SlotBasicRoot, defineCustomElement };
