import { H, p as proxyCustomElement, h, t as transformTag } from './p-DYdAJnXF.js';

const EventBase = class extends H {
    constructor() {
        super(false);
        // Track event calls for testing
        this.baseEventLog = [];
        this.baseGlobalEventCount = 0;
        this.baseLocalEventCount = 0;
    }
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
        // Child-specific event tracking
        this.childEventLog = [];
        this.childGlobalEventCount = 0;
        this.childLocalEventCount = 0;
    }
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
        return (h("div", { key: '65112d345694c25f8fd9ab0c78a54f17101aebd6' }, h("h2", { key: 'd2cc428665c9a72923971c777a8228be6c5e0e9c' }, "Event Handling Inheritance Test"), h("div", { key: '939b8bbdc9885805a908daeb33197b402c6ed885', class: "event-info" }, h("p", { key: 'eb06b5702035fc57a8a293cdb11e6f52758efb1e', class: "base-events" }, "Base Events: ", this.baseEventLog.length), h("p", { key: 'fe1ba9e60b4b3130e34fb0ff72d2b6866fb1fe89', class: "child-events" }, "Child Events: ", this.childEventLog.length), h("p", { key: '4a8df9e365fae1fad3e526b2f69505d70b8a3fd9', class: "total-events" }, "Total Events: ", combinedLog.length), h("p", { key: '4c004458bdc4ea00c0f7702fc6c1c8a56b15c358', class: "global-count" }, "Global Events: ", totalGlobal), h("p", { key: '337fb5468d6b03f50cfe69caee2c848004fef47a', class: "local-count" }, "Local Events: ", totalLocal)), h("div", { key: 'dacccbeef9c00bd2800eae87dc411bba834176d0', class: "event-log" }, h("h3", { key: '4bffad1e08d5426195a9eb3f90308426b052aa5b' }, "Event Log:"), h("ul", { key: 'b0c1d8240fbff72493b0f5aa4f6ca61deebfdcfd', id: "event-log-list" }, combinedLog.map((event, index) => (h("li", { key: index }, event))))), h("div", { key: 'e513f234634e0c6926b22e71c3f095e6b03fcee5', class: "controls" }, h("h3", { key: 'ace4bdeb54ed892f67facdaab76e2b3533edaeb5' }, "Trigger Events:"), h("button", { key: 'd8aa68c1cfeb2146c74cae2a97f072179d2dc0f5', class: "trigger-base-window", onClick: () => this.triggerBaseWindowEvent() }, "Base Window Event"), h("button", { key: 'd425f38514740e8d937cc4e917e3fca28a86d17d', class: "trigger-base-document", onClick: () => this.triggerBaseDocumentEvent() }, "Base Document Event"), h("button", { key: '240cb1e80154372d5636f447211d185226882227', class: "trigger-base-host", onClick: () => this.triggerBaseHostEvent() }, "Base Host Event"), h("button", { key: '88f787956fde7104903e33ebfcb95afb827c02c6', class: "trigger-child-window", onClick: () => this.triggerChildWindowEvent() }, "Child Window Event"), h("button", { key: '1620a569a3fb3dc0d0a9b51b2eae635ebc286f2c', class: "trigger-child-document", onClick: () => this.triggerChildDocumentEvent() }, "Child Document Event"), h("button", { key: 'bc842c3148a1e6e450153ff134618f8184f94fa4', class: "trigger-child-host", onClick: () => this.triggerChildHostEvent() }, "Child Host Event"), h("button", { key: '61c72c56daa36c2706004e15f84ae49c69639b4e', class: "trigger-override", onClick: () => this.triggerOverrideEvent() }, "Override Event"), h("button", { key: '4cc0e63aa26ea78168cf69a579e82c915dc1936d', class: "trigger-bubble", onClick: () => this.triggerBubbleEvent() }, "Bubble Event")), h("div", { key: '20621e5c5351852fc849322d0d7a635175eb9514', class: "test-info" }, h("p", { key: '68ae13e68b4c19bbda319f75296730947c772592' }, "Features: @Listen inheritance | Global vs Local listeners | Event handler override | Event bubbling"))));
    }
    get el() { return this; }
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
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), EventsCmp);
            }
            break;
    } });
}

const ExtendsEvents = EventsCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsEvents, defineCustomElement };
