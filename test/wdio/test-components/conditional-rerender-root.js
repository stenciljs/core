import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-B4t6BGgX.js';

const ConditionalRerenderRoot$1 = /*@__PURE__*/ proxyCustomElement(class ConditionalRerenderRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.showContent = false;
        this.showFooter = false;
    }
    componentDidLoad() {
        this.showFooter = true;
        setTimeout(() => (this.showContent = true), 20);
    }
    render() {
        return (h("conditional-rerender", { key: '2c3634ee579af215e73b943202ed01cc5bf83435' }, h("header", { key: 'cbf4268eb4afe1e6264de11e20317a24659e3393' }, "Header"), this.showContent ? h("section", null, "Content") : null, this.showFooter ? h("footer", null, "Footer") : null));
    }
}, [0, "conditional-rerender-root", {
        "showContent": [32],
        "showFooter": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["conditional-rerender-root", "conditional-rerender"];
    components.forEach(tagName => { switch (tagName) {
        case "conditional-rerender-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ConditionalRerenderRoot$1);
            }
            break;
        case "conditional-rerender":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const ConditionalRerenderRoot = ConditionalRerenderRoot$1;
const defineCustomElement = defineCustomElement$1;

export { ConditionalRerenderRoot, defineCustomElement };
