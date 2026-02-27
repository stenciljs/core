import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-b8F--y-W.js';

const PrefixAttrRoot$1 = /*@__PURE__*/ proxyCustomElement(class PrefixAttrRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.message = 'Hello';
        this.count = 42;
        this.enabled = true;
        this.nullValue = 'not-null';
        this.undefinedValue = 'defined';
    }
    render() {
        return (h("div", { key: '929b28decb74e4b724943c0b34f496c496e93acb' }, h("h3", { key: '909b68e5e0c71ffc7ddf817415f3e49d2fe0c3c9' }, "Testing attr: prefix in JSX"), h("prefix-attr-nested", { key: 'eef35dad77f7481883c57c60726bd7036b25f1fd', "attr:message": this.message, "attr:count": this.count, "attr:enabled": this.enabled, "attr:nullValue": this.nullValue, "attr:undefinedValue": this.undefinedValue }), h("button", { key: '39cd1473dfbc116614a42244cf80a790d61e7039', onClick: () => (this.message = 'Updated') }, "Update Message"), h("button", { key: '425eb830152537066a9ba0a2e1505dff7e4b4d90', onClick: () => (this.count = 99) }, "Update Count"), h("button", { key: 'cafc52af7d6b725f9e59c9f068d8b89373f31824', onClick: () => (this.enabled = false) }, "Disable"), h("button", { key: '3cec044189266657e8da04567cc2add16d2392e2', onClick: () => (this.nullValue = null) }, "Set Null to String"), h("button", { key: 'c4c85df7559e10cc37b80fdf8080a1c59946b5d6', onClick: () => (this.undefinedValue = undefined) }, "Set Undefined to String")));
    }
}, [0, "prefix-attr-root", {
        "message": [32],
        "count": [32],
        "enabled": [32],
        "nullValue": [32],
        "undefinedValue": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["prefix-attr-root", "prefix-attr-nested"];
    components.forEach(tagName => { switch (tagName) {
        case "prefix-attr-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), PrefixAttrRoot$1);
            }
            break;
        case "prefix-attr-nested":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const PrefixAttrRoot = PrefixAttrRoot$1;
const defineCustomElement = defineCustomElement$1;

export { PrefixAttrRoot, defineCustomElement };
