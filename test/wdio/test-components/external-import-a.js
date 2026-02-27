import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { s as store } from './p-BAtGEAHM.js';

const ExternalImportA$1 = /*@__PURE__*/ proxyCustomElement(class ExternalImportA extends H {
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
        return (h("div", { key: 'd7a0b89cc8f13c5140d1c373bfa2af1918c746f9' }, this.first, " ", this.last));
    }
}, [0, "external-import-a"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["external-import-a"];
    components.forEach(tagName => { switch (tagName) {
        case "external-import-a":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ExternalImportA$1);
            }
            break;
    } });
}

const ExternalImportA = ExternalImportA$1;
const defineCustomElement = defineCustomElement$1;

export { ExternalImportA, defineCustomElement };
