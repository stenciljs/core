import { p as proxyCustomElement, H, f as forceUpdate, h, t as transformTag } from './p-DYdAJnXF.js';

const WatchNativeAttributesNoMembers$1 = /*@__PURE__*/ proxyCustomElement(class WatchNativeAttributesNoMembers extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.callbackTriggered = false;
    }
    onAriaLabelChange() {
        this.callbackTriggered = true;
        forceUpdate(this);
    }
    render() {
        return (h("div", { key: '5dc99bd59ecb2050fda083d63747c846d6f9b843' }, h("p", { key: '68b887327dc90353323d058d2b7feb265d48cd9d' }, "Label: ", this.el.getAttribute('aria-label')), h("p", { key: 'efd289ba5ce24ac5d641385b383d83ac9971b70b' }, "Callback triggered: ", `${this.callbackTriggered}`)));
    }
    get el() { return this; }
    static get watchers() { return {
        "aria-label": [{
                "onAriaLabelChange": 0
            }]
    }; }
}, [0, "watch-native-attributes-no-members", undefined, undefined, {
        "aria-label": [{
                "onAriaLabelChange": 0
            }]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["watch-native-attributes-no-members"];
    components.forEach(tagName => { switch (tagName) {
        case "watch-native-attributes-no-members":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), WatchNativeAttributesNoMembers$1);
            }
            break;
    } });
}

const WatchNativeAttributesNoMembers = WatchNativeAttributesNoMembers$1;
const defineCustomElement = defineCustomElement$1;

export { WatchNativeAttributesNoMembers, defineCustomElement };
