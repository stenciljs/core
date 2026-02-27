import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const CustomEventCmp = /*@__PURE__*/ proxyCustomElement(class CustomEventCmp extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.output = '';
    }
    componentDidLoad() {
        this.elm.addEventListener('eventNoDetail', this.receiveEvent.bind(this));
        this.elm.addEventListener('eventWithDetail', this.receiveEvent.bind(this));
    }
    receiveEvent(ev) {
        this.output = `${ev.type} ${ev.detail || ''}`.trim();
    }
    fireCustomEventNoDetail() {
        const ev = new CustomEvent('eventNoDetail');
        this.elm.dispatchEvent(ev);
    }
    fireCustomEventWithDetail() {
        const ev = new CustomEvent('eventWithDetail', { detail: 88 });
        this.elm.dispatchEvent(ev);
    }
    render() {
        return (h("div", { key: '3accd1eab23ab863a8c86daac7c99af8697ae2cf' }, h("div", { key: '4f632aff847fd65553b225f17366cc919b9a60d6' }, h("button", { key: '994a074a221ccf9aede808656a7467fa1622c843', id: "btnNoDetail", onClick: this.fireCustomEventNoDetail.bind(this) }, "Fire Custom Event, no detail")), h("div", { key: 'ef3f6cb2b0a8dc2c64544497a8a1043ffb46a6e6' }, h("button", { key: 'b4b87f638c4fc9c7b1856b9f7758c979f3362457', id: "btnWithDetail", onClick: this.fireCustomEventWithDetail.bind(this) }, "Fire Custom Event, with detail")), h("pre", { key: 'dbf031d2c8e60d9ed820012849b014795d866578', id: "output" }, this.output)));
    }
    get elm() { return this; }
}, [0, "custom-event-root", {
        "output": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["custom-event-root"];
    components.forEach(tagName => { switch (tagName) {
        case "custom-event-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CustomEventCmp);
            }
            break;
    } });
}

const CustomEventRoot = CustomEventCmp;
const defineCustomElement = defineCustomElement$1;

export { CustomEventRoot, defineCustomElement };
