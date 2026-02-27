import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const WatchNativeAttributes$1 = /*@__PURE__*/ proxyCustomElement(class WatchNativeAttributes extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.callbackTriggered = false;
    }
    onAriaLabelChange() {
        this.callbackTriggered = true;
    }
    render() {
        return (h("div", { key: 'a4b30f3826e61d5628646105a9b17cfa4647a674' }, h("p", { key: '66c4717515bc7f4362913839d2488a17b9ef97e0' }, "Label: ", this.el.getAttribute('aria-label')), h("p", { key: '7e0f4b42b2143d29bc5517a3ff8995cba60f7080' }, "Callback triggered: ", `${this.callbackTriggered}`)));
    }
    get el() { return this; }
    static get watchers() { return {
        "aria-label": [{
                "onAriaLabelChange": 0
            }]
    }; }
}, [0, "watch-native-attributes", {
        "callbackTriggered": [32]
    }, undefined, {
        "aria-label": [{
                "onAriaLabelChange": 0
            }]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["watch-native-attributes"];
    components.forEach(tagName => { switch (tagName) {
        case "watch-native-attributes":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), WatchNativeAttributes$1);
            }
            break;
    } });
}

const WatchNativeAttributes = WatchNativeAttributes$1;
const defineCustomElement = defineCustomElement$1;

export { WatchNativeAttributes, defineCustomElement };
