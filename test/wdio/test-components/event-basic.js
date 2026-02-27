import { p as proxyCustomElement, H, e as createEvent, h, t as transformTag } from './p-DYdAJnXF.js';

const EventBasic$1 = /*@__PURE__*/ proxyCustomElement(class EventBasic extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.testEvent = createEvent(this, "testEvent");
        this.counter = 0;
    }
    testEventHandler() {
        this.counter++;
    }
    componentDidLoad() {
        this.testEvent.emit();
    }
    render() {
        return (h("div", { key: 'db755a3fd0e44c7a2da267563aecf6e3e1410e1f' }, h("p", { key: '5e326e82d93592b24b22bbdc29e05bf54beceadb' }, "testEvent is emitted on componentDidLoad"), h("div", { key: '719b94a8aff898a2f3183de0ae3710b530babe55' }, h("p", { key: 'a800f86e5cb94117a65792df6a0dd0ad6ec7a261' }, "Emission count: ", h("span", { key: '01f3ab577c4f42c4a679472f07f7a979eef0eda9', id: "counter" }, this.counter)))));
    }
}, [0, "event-basic", {
        "counter": [32]
    }, [[0, "testEvent", "testEventHandler"]]]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["event-basic"];
    components.forEach(tagName => { switch (tagName) {
        case "event-basic":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), EventBasic$1);
            }
            break;
    } });
}

const EventBasic = EventBasic$1;
const defineCustomElement = defineCustomElement$1;

export { EventBasic, defineCustomElement };
