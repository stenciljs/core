import { H, t as transformTag, p as proxyCustomElement, h } from './index.js';

const EventBase = class extends H {
    constructor() {
        super(false);
    }
    // Track event calls for testing
    baseEventLog = [];
    baseGlobalEventCount = 0;
    baseLocalEventCount = 0;
    // Global window listener - inherited by child
    handleBaseWindowEvent() {
        this.baseEventLog.push('base-window-event');
        this.baseGlobalEventCount++;
    }
    // Global document listener - inherited by child
    handleBaseDocumentEvent() {
        this.baseEventLog.push('base-document-event');
        this.baseGlobalEventCount++;
    }
    // Local host listener - inherited by child
    handleBaseHostEvent() {
        this.baseEventLog.push('base-host-event');
        this.baseLocalEventCount++;
    }
    // Event handler that can be overridden in child
    handleOverrideEvent() {
        this.baseEventLog.push('override-event:base');
        this.baseLocalEventCount++;
    }
    // Helper method to get event log
    getEventLog() {
        return [...this.baseEventLog];
    }
    // Helper method to reset event tracking
    resetEventLog() {
        this.baseEventLog = [];
        this.baseGlobalEventCount = 0;
        this.baseLocalEventCount = 0;
    }
};

const EventsCmp = /*@__PURE__*/ proxyCustomElement(class EventsCmp extends EventBase {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    get el() { return this; }
    // Child-specific event tracking
    childEventLog = [];
    childGlobalEventCount = 0;
    childLocalEventCount = 0;
    // Additional global window listener in child
    handleChildWindowEvent() {
        this.childEventLog.push('child-window-event');
        this.childGlobalEventCount++;
    }
    // Additional document listener in child
    handleChildDocumentEvent() {
        this.childEventLog.push('child-document-event');
        this.childGlobalEventCount++;
    }
    // Additional local host listener in child
    handleChildHostEvent() {
        this.childEventLog.push('child-host-event');
        this.childLocalEventCount++;
    }
    // Override base event handler - child version takes precedence
    handleOverrideEvent() {
        this.childEventLog.push('override-event:child');
        this.childLocalEventCount++;
        // Note: base handler is NOT called automatically - this is override behavior
    }
    // Event that bubbles - test event propagation
    handleBubbleEvent(_e) {
        this.childEventLog.push('bubble-event:child');
        this.childLocalEventCount++;
        // Allow event to continue bubbling
    }
    // Method to trigger events for testing
    triggerBaseWindowEvent() {
        window.dispatchEvent(new Event('base-window-event', { bubbles: true, cancelable: true, composed: true }));
    }
    triggerBaseDocumentEvent() {
        document.dispatchEvent(new Event('base-document-event', { bubbles: true, cancelable: true, composed: true }));
    }
    triggerBaseHostEvent() {
        this.el.dispatchEvent(new Event('base-host-event', { bubbles: true, cancelable: true, composed: true }));
    }
    triggerChildWindowEvent() {
        window.dispatchEvent(new Event('child-window-event', { bubbles: true, cancelable: true, composed: true }));
    }
    triggerChildDocumentEvent() {
        document.dispatchEvent(new Event('child-document-event', { bubbles: true, cancelable: true, composed: true }));
    }
    triggerChildHostEvent() {
        this.el.dispatchEvent(new Event('child-host-event', { bubbles: true, cancelable: true, composed: true }));
    }
    triggerOverrideEvent() {
        this.el.dispatchEvent(new Event('override-event', { bubbles: true, cancelable: true, composed: true }));
    }
    triggerBubbleEvent() {
        this.el.dispatchEvent(new Event('bubble-event', { bubbles: true, cancelable: true, composed: true }));
    }
    // Expose base class method for testing
    getEventLog() {
        return super.getEventLog();
    }
    // Get combined event log
    getCombinedEventLog() {
        return [...this.baseEventLog, ...this.childEventLog];
    }
    render() {
        const combinedLog = this.getCombinedEventLog();
        const totalGlobal = this.baseGlobalEventCount + this.childGlobalEventCount;
        const totalLocal = this.baseLocalEventCount + this.childLocalEventCount;
        return (h("div", { key: '93cdad4c5209120b3fd29d2e6d10f70d2dcd2327' }, h("h2", { key: 'e4b71d760fc9e7c56f1a87b2f611aed32b657f55' }, "Event Handling Inheritance Test"), h("div", { key: '525b516b1368c5fdc93d9987d486c6473dec4819', class: "event-info" }, h("p", { key: '1f2af5a4eb5cb8206c555b50ee8129b6d1d46e33', class: "base-events" }, "Base Events: ", this.baseEventLog.length), h("p", { key: '0d16825b3896aad45331eb7cddeaf3c17ae113f6', class: "child-events" }, "Child Events: ", this.childEventLog.length), h("p", { key: 'db66c13a10dbe98274227108e94bcbd56668a93b', class: "total-events" }, "Total Events: ", combinedLog.length), h("p", { key: '7a2310654e25b2b785711e258667613a6d4d622f', class: "global-count" }, "Global Events: ", totalGlobal), h("p", { key: 'db50dbfb93806c0baeb63b2a575f24bbde9c7e8e', class: "local-count" }, "Local Events: ", totalLocal)), h("div", { key: '55bc03827b1b7bff3dca52e46ab895d00ad40a2f', class: "event-log" }, h("h3", { key: '178a3f3c6ca8860026d167187be4663d6a7e9f67' }, "Event Log:"), h("ul", { key: 'bc67a86415f8d7312086f853f13b48b08bf136d9', id: "event-log-list" }, combinedLog.map((event, index) => (h("li", { key: index }, event))))), h("div", { key: 'f55213680252440168418fbc40f283945d93adc0', class: "controls" }, h("h3", { key: 'ad45d3b239e4dd2cd88deea12902f26d67fb3a35' }, "Trigger Events:"), h("button", { key: '6bde1d77ba11b556013a695a52f6b484ee8bc617', class: "trigger-base-window", onClick: () => this.triggerBaseWindowEvent() }, "Base Window Event"), h("button", { key: '1f18f24b1bdcded6e3e62164de01525afefc4a8c', class: "trigger-base-document", onClick: () => this.triggerBaseDocumentEvent() }, "Base Document Event"), h("button", { key: 'b5d39301192b35b29a3292e07268b992be33413c', class: "trigger-base-host", onClick: () => this.triggerBaseHostEvent() }, "Base Host Event"), h("button", { key: 'fc6ce853d9c5c7b38c381996a7246755d79682c7', class: "trigger-child-window", onClick: () => this.triggerChildWindowEvent() }, "Child Window Event"), h("button", { key: 'a78834253ea7f90bf5f12d4c7997eab67105caaa', class: "trigger-child-document", onClick: () => this.triggerChildDocumentEvent() }, "Child Document Event"), h("button", { key: '9266b36fdcb3859bd3b2b354b78da2a8561074b8', class: "trigger-child-host", onClick: () => this.triggerChildHostEvent() }, "Child Host Event"), h("button", { key: '81f26ad672998147216f096ea867c92e6e1c0188', class: "trigger-override", onClick: () => this.triggerOverrideEvent() }, "Override Event"), h("button", { key: '9274e91556ccaa36cf7dac80b7226d998825d053', class: "trigger-bubble", onClick: () => this.triggerBubbleEvent() }, "Bubble Event")), h("div", { key: '96f49416ad768a8432ba945ddc943946d52e7a96', class: "test-info" }, h("p", { key: 'b8ca3d2d82d2413628ec59f2a505415b5a7124df' }, "Features: @Listen inheritance | Global vs Local listeners | Event handler override | Event bubbling"))));
    }
}, [512, "extends-events", {
        "baseEventLog": [32],
        "baseGlobalEventCount": [32],
        "baseLocalEventCount": [32],
        "childEventLog": [32],
        "childGlobalEventCount": [32],
        "childLocalEventCount": [32]
    }, [[8, "base-window-event", "handleBaseWindowEvent"], [4, "base-document-event", "handleBaseDocumentEvent"], [0, "base-host-event", "handleBaseHostEvent"], [8, "child-window-event", "handleChildWindowEvent"], [4, "child-document-event", "handleChildDocumentEvent"], [0, "child-host-event", "handleChildHostEvent"], [0, "override-event", "handleOverrideEvent"], [0, "bubble-event", "handleBubbleEvent"]]]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["extends-events"];
    components.forEach(tagName => { switch (tagName) {
        case "extends-events":
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), EventsCmp);
            }
            break;
    } });
}
defineCustomElement$1();

const ExtendsEvents = EventsCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsEvents, defineCustomElement };
//# sourceMappingURL=extends-events.js.map

//# sourceMappingURL=extends-events.js.map