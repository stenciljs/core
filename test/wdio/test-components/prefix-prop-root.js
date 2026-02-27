import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-DJnRsdL0.js';

const PrefixPropRoot$1 = /*@__PURE__*/ proxyCustomElement(class PrefixPropRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.message = 'Hello';
        this.count = 42;
        this.nullValue = null;
        this.undefinedValue = undefined;
    }
    render() {
        return (h("div", { key: '6c186bb902ed8b7da962e2d17eee4f37ab55332e' }, h("h3", { key: 'dbccac541278b7809fb51bf31aea72e4b0a6f157' }, "Testing prop: prefix in JSX"), h("prefix-prop-nested", { key: '2e0701fb59e875784ce8f5f96ff76956fcb5be36', "prop:message": this.message, "prop:count": this.count, "prop:nullValue": this.nullValue, "prop:undefinedValue": this.undefinedValue }), h("button", { key: 'e07defffcd377d454fa1f5c53071dced3606a602', onClick: () => (this.message = 'Updated') }, "Update Message"), h("button", { key: '4e939e4a78655357301f18d87b6fd5d68c724a2a', onClick: () => (this.count = 99) }, "Update Count"), h("button", { key: 'f1d22c130497ec2884d4ce19923d9bdc18145b75', onClick: () => (this.nullValue = 'not-null') }, "Set Null to String"), h("button", { key: 'b0ac70b9112f89e315adb1b6f492e43e4ee33d2d', onClick: () => (this.undefinedValue = 'defined') }, "Set Undefined to String")));
    }
}, [0, "prefix-prop-root", {
        "message": [32],
        "count": [32],
        "nullValue": [32],
        "undefinedValue": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["prefix-prop-root", "prefix-prop-nested"];
    components.forEach(tagName => { switch (tagName) {
        case "prefix-prop-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), PrefixPropRoot$1);
            }
            break;
        case "prefix-prop-nested":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const PrefixPropRoot = PrefixPropRoot$1;
const defineCustomElement = defineCustomElement$1;

export { PrefixPropRoot, defineCustomElement };
