import { p as proxyCustomElement, H, e as createEvent, h, t as transformTag } from './p-DYdAJnXF.js';
import { t as timeout, d as defineCustomElement$1 } from './p-EcrEM3zD.js';

const LifecycleAsyncB = /*@__PURE__*/ proxyCustomElement(class LifecycleAsyncB extends H {
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
    async componentWillLoad() {
        this.lifecycleLoad.emit('componentWillLoad-b');
    }
    async componentDidLoad() {
        this.lifecycleLoad.emit('componentDidLoad-b');
    }
    async componentWillUpdate() {
        this.lifecycleUpdate.emit('componentWillUpdate-b');
        await timeout(100);
    }
    async componentDidUpdate() {
        this.lifecycleUpdate.emit('componentDidUpdate-b');
        await timeout(100);
    }
    render() {
        this.rendered++;
        return (h("div", { key: '539af255652e93ddc8753454be237225851cba11' }, h("hr", { key: '254af72318d3c1c3eecc8ce179db4f2f5004ffb4' }), h("div", { key: '7af9b6d100548a938ec9abbc47cc68f5df1f193d' }, "LifecycleAsyncB ", this.value), h("div", { key: 'ae94b8d0fc84e8a871a13a5ec03a1d1abc469604', class: "rendered-b" }, "rendered b: ", this.rendered), h("lifecycle-async-c", { key: '0e5f5aa2498b5fbad8eca4334af88c631bce464b', value: this.value })));
    }
}, [0, "lifecycle-async-b", {
        "value": [1]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["lifecycle-async-b", "lifecycle-async-c"];
    components.forEach(tagName => { switch (tagName) {
        case "lifecycle-async-b":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), LifecycleAsyncB);
            }
            break;
        case "lifecycle-async-c":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$1();
            }
            break;
    } });
}

export { LifecycleAsyncB as L, defineCustomElement as d };
