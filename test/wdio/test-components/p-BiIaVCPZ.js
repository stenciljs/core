import { p as proxyCustomElement, H, e as createEvent, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$1 } from './p-BPMgzNMJ.js';

const LifecycleBasicB = /*@__PURE__*/ proxyCustomElement(class LifecycleBasicB extends H {
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
        this.lifecycleLoad.emit('componentWillLoad-b');
    }
    componentDidLoad() {
        this.lifecycleLoad.emit('componentDidLoad-b');
    }
    componentWillUpdate() {
        this.lifecycleUpdate.emit('componentWillUpdate-b');
    }
    componentDidUpdate() {
        this.lifecycleUpdate.emit('componentDidUpdate-b');
    }
    render() {
        this.rendered++;
        return (h("div", { key: '2a7b22826aa083d6db04c995b1d3417b02606b3c' }, h("hr", { key: 'b1108e40dc341982ff8d97504c6514ec44066165' }), h("div", { key: '86fdbd94a57439a43e19772cdad566a8ff26087b' }, "LifecycleBasicB ", this.value), h("div", { key: '673696aa2d292bce084b45ef44be732f0f28cd32', class: "rendered-b" }, "rendered b: ", this.rendered), h("lifecycle-basic-c", { key: '54bb13fc99cae24edabeb701713630cac2c59f02', value: this.value })));
    }
}, [0, "lifecycle-basic-b", {
        "value": [1],
        "rendered": [32]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["lifecycle-basic-b", "lifecycle-basic-c"];
    components.forEach(tagName => { switch (tagName) {
        case "lifecycle-basic-b":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), LifecycleBasicB);
            }
            break;
        case "lifecycle-basic-c":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$1();
            }
            break;
    } });
}

export { LifecycleBasicB as L, defineCustomElement as d };
