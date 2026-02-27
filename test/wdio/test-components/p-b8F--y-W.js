import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const PrefixAttrNested = /*@__PURE__*/ proxyCustomElement(class PrefixAttrNested extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: '40fbcf77216e7865ab3499e827afd4dd626e73e7', class: "nested-output" }, h("div", { key: 'ae72d74775cdc744c7de093b58b69574a33cd606', class: "message" }, this.message), h("div", { key: '96ae87f1a3868b5427391128afd1ff7084ea1d42', class: "count" }, this.count), h("div", { key: '744b962c9d48710d4c128a73b2c0d48029186bc0', class: "enabled" }, String(this.enabled)), h("div", { key: '0dc45d8d4760185cceb671b237e4b106c67240e8', class: "null-value" }, String(this.nullValue)), h("div", { key: '0921c7e5a2943f807a151a893bb9e2cd5ae4dd51', class: "undefined-value" }, String(this.undefinedValue))));
    }
}, [0, "prefix-attr-nested", {
        "message": [1],
        "count": [2],
        "enabled": [4],
        "nullValue": [1, "null-value"],
        "undefinedValue": [1, "undefined-value"]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["prefix-attr-nested"];
    components.forEach(tagName => { switch (tagName) {
        case "prefix-attr-nested":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), PrefixAttrNested);
            }
            break;
    } });
}

export { PrefixAttrNested as P, defineCustomElement as d };
