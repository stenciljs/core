import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-Bjpunz7F.js';

const SlotFallbackRoot$1 = /*@__PURE__*/ proxyCustomElement(class SlotFallbackRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.fallbackInc = 0;
        this.inc = 0;
        this.slotContent = 'slot light dom 0';
        this.contentInc = 0;
    }
    changeLightDom() {
        this.inc++;
    }
    changeSlotContent() {
        this.contentInc++;
        this.slotContent = 'slot light dom ' + this.contentInc;
    }
    changeFallbackContent() {
        this.fallbackInc++;
    }
    render() {
        return [
            h("button", { key: '41fbebd12a6642fd88622c02182174c0c5a816a8', onClick: this.changeFallbackContent.bind(this), class: "change-fallback-content" }, "Change Fallback Slot Content"),
            h("button", { key: '80671700c73d15aad7d67ccd3c009d0183ce93ea', onClick: this.changeLightDom.bind(this), class: "change-light-dom" }, this.inc % 2 === 0 ? 'Use light dom content' : 'Use fallback slot content'),
            h("button", { key: '5caf8f99bf1a12f67bbf08330decc5c2aac91767', onClick: this.changeSlotContent.bind(this), class: "change-slot-content" }, "Change Slot Content"),
            h("slot-fallback", { key: '569b3bed18b74ce7bc90b0e60872655f3f33d43f', inc: this.fallbackInc, class: "results1" }, this.inc % 2 !== 0
                ? [
                    h("content-default", null, this.slotContent, " : default"),
                    h("content-end", { slot: "end" }, this.slotContent, " : end"),
                    h("content-start", { slot: "start" }, this.slotContent, " : start"),
                ]
                : null),
        ];
    }
}, [0, "slot-fallback-root", {
        "fallbackInc": [32],
        "inc": [32],
        "slotContent": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-fallback-root", "slot-fallback"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-fallback-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotFallbackRoot$1);
            }
            break;
        case "slot-fallback":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const SlotFallbackRoot = SlotFallbackRoot$1;
const defineCustomElement = defineCustomElement$1;

export { SlotFallbackRoot, defineCustomElement };
