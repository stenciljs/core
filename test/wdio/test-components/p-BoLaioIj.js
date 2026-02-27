import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const ScopedSlotConnectedCallbackChild = /*@__PURE__*/ proxyCustomElement(class ScopedSlotConnectedCallbackChild extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    connectedCallback() {
        // Check if slotted content is available in connectedCallback
        const slottedContent = this.el.querySelector('#slotted-content');
        if (slottedContent) {
            this.el.setAttribute('data-connected-slot-available', 'true');
        }
        else {
            this.el.setAttribute('data-connected-slot-available', 'false');
        }
    }
    componentWillLoad() {
        // Also check in componentWillLoad for comparison
        const slottedContent = this.el.querySelector('#slotted-content');
        if (slottedContent) {
            this.el.setAttribute('data-willload-slot-available', 'true');
        }
        else {
            this.el.setAttribute('data-willload-slot-available', 'false');
        }
    }
    render() {
        return (h("div", { key: '54af6bcb1a43d7ea05b10c3bccdd68170fae4aab', class: "wrapper" }, "Before slot | ", h("slot", { key: '7ba8fdfbb4171c0f2737f688209bee1525c2747b' }), " | After slot"));
    }
    get el() { return this; }
}, [260, "scoped-slot-connectedcallback-child"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["scoped-slot-connectedcallback-child"];
    components.forEach(tagName => { switch (tagName) {
        case "scoped-slot-connectedcallback-child":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ScopedSlotConnectedCallbackChild);
            }
            break;
    } });
}

export { ScopedSlotConnectedCallbackChild as S, defineCustomElement as d };
