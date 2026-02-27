import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const DynamicImport$1 = /*@__PURE__*/ proxyCustomElement(class DynamicImport extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    async componentWillLoad() {
        await this.update();
    }
    async getResult() {
        return (await import('./p-DTafmbrE.js')).getResult();
    }
    async update() {
        this.value = await this.getResult();
    }
    render() {
        return h("div", { key: '732b1183af4c029d6e2438b885c7d68674da19dc' }, this.value);
    }
}, [0, "dynamic-import", {
        "value": [32],
        "update": [64]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["dynamic-import"];
    components.forEach(tagName => { switch (tagName) {
        case "dynamic-import":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), DynamicImport$1);
            }
            break;
    } });
}

const DynamicImport = DynamicImport$1;
const defineCustomElement = defineCustomElement$1;

export { DynamicImport, defineCustomElement };
