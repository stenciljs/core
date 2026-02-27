import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const CrossDocumentStyleTestCmp = /*@__PURE__*/ proxyCustomElement(class CrossDocumentStyleTestCmp extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return (h("section", { key: '6d13befe9ca37b2a9467c864bd721a74e58c922a' }, h("div", { key: 'f5b364a679dcd4e8406bbb8c650379624cf260e1' }, "I am rendered in red!")));
    }
    static get style() { return `:host {
      color: rgb(255, 0, 0);
    }`; }
}, [1, "cross-document-style"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["cross-document-style"];
    components.forEach(tagName => { switch (tagName) {
        case "cross-document-style":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CrossDocumentStyleTestCmp);
            }
            break;
    } });
}

const CrossDocumentStyle = CrossDocumentStyleTestCmp;
const defineCustomElement = defineCustomElement$1;

export { CrossDocumentStyle, defineCustomElement };
