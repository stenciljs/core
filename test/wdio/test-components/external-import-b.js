import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { s as store } from './p-BAtGEAHM.js';

const ExternalImportB$1 = /*@__PURE__*/ proxyCustomElement(class ExternalImportB extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    componentWillLoad() {
        const data = store().data;
        this.first = data.first;
        this.last = data.last;
    }
    render() {
        return (h("div", { key: 'f9f73c90834ef1a812c150b8d07509934057102d' }, this.first, " ", this.last));
    }
}, [0, "external-import-b"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["external-import-b"];
    components.forEach(tagName => { switch (tagName) {
        case "external-import-b":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ExternalImportB$1);
            }
            break;
    } });
}

const ExternalImportB = ExternalImportB$1;
const defineCustomElement = defineCustomElement$1;

export { ExternalImportB, defineCustomElement };
