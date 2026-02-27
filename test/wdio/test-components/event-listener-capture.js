import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const EventListenerCapture$1 = /*@__PURE__*/ proxyCustomElement(class EventListenerCapture extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.counter = 0;
    }
    render() {
        return (h("div", { key: '49b25be47a8bdb182177102c6bfee6849895e637' }, h("p", { key: '62bd087b4f00c64d1b1a5da4f7f944efbf475e0b' }, "Click the text below to trigger a capture style event"), h("div", { key: '4eeb0c3973f8e111f5eda30917a0f3eed7b4a982' }, h("p", { key: 'f68a25dde66ce328b0015f0d17e16a71939b80c2', id: "incrementer", onClickCapture: () => this.counter++ }, "Clicked: ", h("span", { key: '8dab6857b8e7fd6e15e8e1af725ad88a84abbf0d', id: "counter" }, this.counter), " time(s)"))));
    }
}, [0, "event-listener-capture", {
        "counter": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["event-listener-capture"];
    components.forEach(tagName => { switch (tagName) {
        case "event-listener-capture":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), EventListenerCapture$1);
            }
            break;
    } });
}

const EventListenerCapture = EventListenerCapture$1;
const defineCustomElement = defineCustomElement$1;

export { EventListenerCapture, defineCustomElement };
