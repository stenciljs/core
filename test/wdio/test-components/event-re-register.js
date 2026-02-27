import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const eventReRegisterCss = () => `:host{display:block;padding:5px;background:bisque;cursor:pointer;max-width:300px}:host(:focus){outline:2px solid blue}`;

const EventReRegister$1 = /*@__PURE__*/ proxyCustomElement(class EventReRegister extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
        this.eventFiredTimes = 0;
    }
    handleKeydown(event) {
        this.eventFiredTimes++;
        console.log(event);
    }
    connectedCallback() {
        console.log('connected');
    }
    disconnectedCallback() {
        console.log('disconnected');
    }
    render() {
        return (h(Host, { key: '8e80926e5de503d104f10064fcd476724a2b24dc', tabindex: "1" }, h("ul", { key: '74d3b59eb35b339bfe632c1da224d68bedc69606', id: "reattach" }, h("li", { key: 'a87289c17a50c1c3b3bb31ade4663ba1cc298df0' }, "Focus this component;"), h("li", { key: '4e10f8218b01972cfeb3ed7843bb8e6b1a5f5cd6' }, "Press key;"), h("li", { key: '4409f06b659141f2b418c98c5c33d90605d40780' }, "See console output"), h("li", { key: 'e37dfb519539f8daf3b45371f0d645329448b129' }, "Press 'Reconnect' button"), h("li", { key: '77e841f088bea590c7a8b47bf446f8464a2f5c2d' }, "Repeat steps 1-3")), h("p", { key: '738c69626abad99a4c51909d245a3c53e79424c3' }, "Event fired times: ", this.eventFiredTimes)));
    }
    static get style() { return eventReRegisterCss(); }
}, [1, "event-re-register", {
        "eventFiredTimes": [32]
    }, [[0, "keydown", "handleKeydown"]]]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["event-re-register"];
    components.forEach(tagName => { switch (tagName) {
        case "event-re-register":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), EventReRegister$1);
            }
            break;
    } });
}

const EventReRegister = EventReRegister$1;
const defineCustomElement = defineCustomElement$1;

export { EventReRegister, defineCustomElement };
