import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const SlotBasic = /*@__PURE__*/ proxyCustomElement(class SlotBasic extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("header", { key: 'befd22ee2171d1b29d5643f652a09eb87962c854' }, h("section", { key: '8817eccc073bacd7191e8e48833f42dc5449ea9f' }, h("article", { key: '2da52e037f9689ad8a49507597f45df592a8e8db' }, h("slot", { key: '8378436f13ed616a2d507b696120d7c068d5b1e3' })))));
    }
}, [260, "slot-basic"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-basic"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-basic":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotBasic);
            }
            break;
    } });
}

export { SlotBasic as S, defineCustomElement as d };
