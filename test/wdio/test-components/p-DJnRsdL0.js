import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const PrefixPropNested = /*@__PURE__*/ proxyCustomElement(class PrefixPropNested extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: 'f4e4564e5e0e65b1b6b6048b01ce20366673a251', class: "nested-output" }, h("div", { key: '332ddf1147d6e4fd515479be30d745b8607ee16f', class: "message" }, this.message), h("div", { key: '9d9e598a0b89b100ec9cfa2fd3a14544bc7ad974', class: "count" }, this.count), h("div", { key: '46786fc0fc10bc588b1033b836376bb6dd781d93', class: "null-value" }, String(this.nullValue)), h("div", { key: 'a4aece531bb9b4eba91ac815e4ffce717c33071f', class: "undefined-value" }, String(this.undefinedValue))));
    }
}, [0, "prefix-prop-nested", {
        "message": [1],
        "count": [2],
        "nullValue": [1, "null-value"],
        "undefinedValue": [1, "undefined-value"]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["prefix-prop-nested"];
    components.forEach(tagName => { switch (tagName) {
        case "prefix-prop-nested":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), PrefixPropNested);
            }
            break;
    } });
}

export { PrefixPropNested as P, defineCustomElement as d };
