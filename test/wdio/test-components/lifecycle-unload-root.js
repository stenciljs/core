import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$3 } from './p-CjFPVipu.js';
import { d as defineCustomElement$2 } from './p-DG_XnOR5.js';

const LifecycleUnloadRoot$1 = /*@__PURE__*/ proxyCustomElement(class LifecycleUnloadRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.renderCmp = true;
    }
    testClick() {
        this.renderCmp = !this.renderCmp;
    }
    render() {
        return (h("div", { key: '8072072a84991635e9de1da2675c787760ca69a1' }, h("button", { key: '06d4ee188646120c1119fdf983e2d5d449d032dd', onClick: this.testClick.bind(this) }, this.renderCmp ? 'Remove' : 'Add'), this.renderCmp ? h("lifecycle-unload-a", null) : null));
    }
}, [0, "lifecycle-unload-root", {
        "renderCmp": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["lifecycle-unload-root", "lifecycle-unload-a", "lifecycle-unload-b"];
    components.forEach(tagName => { switch (tagName) {
        case "lifecycle-unload-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), LifecycleUnloadRoot$1);
            }
            break;
        case "lifecycle-unload-a":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$3();
            }
            break;
        case "lifecycle-unload-b":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const LifecycleUnloadRoot = LifecycleUnloadRoot$1;
const defineCustomElement = defineCustomElement$1;

export { LifecycleUnloadRoot, defineCustomElement };
