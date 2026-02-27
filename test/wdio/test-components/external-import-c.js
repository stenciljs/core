import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as data } from './p-DeYt65VK.js';

const ExternalImportB = /*@__PURE__*/ proxyCustomElement(class ExternalImportB extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    componentWillLoad() {
        this.first = data().first;
        this.last = data().last;
    }
    render() {
        return (h("div", { key: '8baf21c7399f6c1ef22a0c5d6c57612132275108' }, this.first, " ", this.last));
    }
}, [0, "external-import-c"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["external-import-c"];
    components.forEach(tagName => { switch (tagName) {
        case "external-import-c":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ExternalImportB);
            }
            break;
    } });
}

const ExternalImportC = ExternalImportB;
const defineCustomElement = defineCustomElement$1;

export { ExternalImportC, defineCustomElement };
