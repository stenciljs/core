import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const SlotReplaceWrapper = /*@__PURE__*/ proxyCustomElement(class SlotReplaceWrapper extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        const TagType = (this.href != null ? 'a' : 'div');
        const attrs = (this.href != null ? { href: this.href, target: '_blank' } : {});
        return [
            h(TagType, Object.assign({ key: 'dda6656436533bbc85a7953fba0950143383d924' }, attrs), h("slot", { key: '3d7b034d3932850b65a8dfe7cd048a8f7cc68430', name: "start" }), h("span", { key: '8c6d8e19214ca749d910569d5019a24b3abddfe6' }, h("slot", { key: 'c4c75a9e73d1f73cc42655ebbfbf91a6a9c20371' }), h("span", { key: 'e4328e348e4e8c9aaff621058f7a368e6bbccce4' }, h("slot", { key: '8265ad51b69d465f550ecb754ced7df7fc93437f', name: "end" })))),
            h("hr", { key: 'f452b4c17a7eab045af6003cf8be9bed5573d8a9' }),
        ];
    }
}, [260, "slot-replace-wrapper", {
        "href": [1]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-replace-wrapper"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-replace-wrapper":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotReplaceWrapper);
            }
            break;
    } });
}

export { SlotReplaceWrapper as S, defineCustomElement as d };
