import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const AttributeHtmlRoot$1 = /*@__PURE__*/ proxyCustomElement(class AttributeHtmlRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return [
            h("p", { key: 'b16533fa9ff3ef34ab19434c54d84ec2118220cf' }, "strAttr:", ' ', h("strong", { key: 'e7e80837a01adc5f5cc794876d6113d4800b7517', id: "str-attr" }, this.strAttr, " ", typeof this.strAttr)),
            h("p", { key: 'f950e70922f8fef4a851b688507c0946966c78d2' }, "anyAttr:", ' ', h("strong", { key: '716205823041e395a4f1ffbacccc06ece74e3082', id: "any-attr" }, this.anyAttr, " ", typeof this.anyAttr)),
            h("p", { key: 'c8c5de14d2ba7f8cb14b2336f7c1bc27978b4c28' }, "nuAttr:", ' ', h("strong", { key: '2b92d3ca8f78dcdc289aa9e1fda069e1d8551ac5', id: "nu-attr" }, this.nuAttr, " ", typeof this.nuAttr)),
        ];
    }
}, [0, "attribute-html-root", {
        "strAttr": [1, "str-attr"],
        "anyAttr": [8, "any-attr"],
        "nuAttr": [2, "nu-attr"]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["attribute-html-root"];
    components.forEach(tagName => { switch (tagName) {
        case "attribute-html-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), AttributeHtmlRoot$1);
            }
            break;
    } });
}

const AttributeHtmlRoot = AttributeHtmlRoot$1;
const defineCustomElement = defineCustomElement$1;

export { AttributeHtmlRoot, defineCustomElement };
