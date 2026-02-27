import { p as proxyCustomElement, H, e as createEvent, h, t as transformTag } from './p-DYdAJnXF.js';

const LifecycleBasicC = /*@__PURE__*/ proxyCustomElement(class LifecycleBasicC extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.lifecycleLoad = createEvent(this, "lifecycleLoad");
        this.lifecycleUpdate = createEvent(this, "lifecycleUpdate");
        this.value = '';
        this.rendered = 0;
    }
    componentWillLoad() {
        this.lifecycleLoad.emit('componentWillLoad-c');
    }
    componentDidLoad() {
        this.lifecycleLoad.emit('componentDidLoad-c');
    }
    componentWillUpdate() {
        this.lifecycleUpdate.emit('componentWillUpdate-c');
    }
    componentDidUpdate() {
        this.lifecycleUpdate.emit('componentDidUpdate-c');
    }
    render() {
        this.rendered++;
        return (h("div", { key: '994fd345f67fb45ad0ab02ed72fb026102e9108e' }, h("hr", { key: '0bb4c07078c3c2529d750e9cfa682c054f9aef80' }), h("div", { key: '2c6f215485c72b99a58c21fb5d9fe88a730f17b0' }, "LifecycleBasicC ", this.value), h("div", { key: '3408fc84d69779ed84aa5ddc2150f67145339792', class: "rendered-c" }, "rendered c: ", this.rendered)));
    }
}, [0, "lifecycle-basic-c", {
        "value": [1],
        "rendered": [32]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["lifecycle-basic-c"];
    components.forEach(tagName => { switch (tagName) {
        case "lifecycle-basic-c":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), LifecycleBasicC);
            }
            break;
    } });
}

export { LifecycleBasicC as L, defineCustomElement as d };
