import { p as proxyCustomElement, H, e as createEvent, h, t as transformTag } from './p-DYdAJnXF.js';

const EventCustomType$1 = /*@__PURE__*/ proxyCustomElement(class EventCustomType extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.testEvent = createEvent(this, "testEvent");
        this.counter = 0;
    }
    testEventHandler(newValue) {
        this.counter++;
        this.lastEventValue = newValue.detail;
    }
    componentDidLoad() {
        this.testEvent.emit({
            value: 'Test value',
        });
    }
    render() {
        return (h("div", { key: 'a74e523b09d12d00c4ddf36d006ff24ca76c25dc' }, h("p", { key: '3759b62fdc2119b45a02778146259c62a7ae28d0' }, "testEvent is emitted on componentDidLoad"), h("div", { key: '2c874e2dd5918b4288c575080920075e3a2b0389' }, h("p", { key: '6d8424d3dbb90a90d54c807d58a945caeaa4ee2e' }, "Emission count: ", h("span", { key: '32e99a1b12542d20d376c18b2730c6a982a95796', id: "counter" }, this.counter)), h("p", { key: '50c52b9e6355436fb64e57a7060694dad8bdc42f' }, "Last emitted value: ", h("span", { key: '8be784616e5fad49bd19050f1f4e657193578ea9', id: "lastValue" }, JSON.stringify(this.lastEventValue))))));
    }
}, [0, "event-custom-type", {
        "counter": [32],
        "lastEventValue": [32]
    }, [[0, "testEvent", "testEventHandler"]]]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["event-custom-type"];
    components.forEach(tagName => { switch (tagName) {
        case "event-custom-type":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), EventCustomType$1);
            }
            break;
    } });
}

const EventCustomType = EventCustomType$1;
const defineCustomElement = defineCustomElement$1;

export { EventCustomType, defineCustomElement };
