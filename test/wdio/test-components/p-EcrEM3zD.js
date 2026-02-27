import { p as proxyCustomElement, H, e as createEvent, h, t as transformTag } from './p-DYdAJnXF.js';

function timeout(ms) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), ms);
    });
}

const LifecycleAsyncC = /*@__PURE__*/ proxyCustomElement(class LifecycleAsyncC extends H {
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
        this.lifecycleLoad.emit('componentWillLoad-c');
    }
    async componentDidLoad() {
        this.lifecycleLoad.emit('componentDidLoad-c');
    }
    async componentWillUpdate() {
        this.lifecycleUpdate.emit('componentWillUpdate-c');
        await timeout(100);
    }
    async componentDidUpdate() {
        this.lifecycleUpdate.emit('componentDidUpdate-c');
        await timeout(100);
    }
    render() {
        this.rendered++;
        return (h("div", { key: 'fa816ee16e445cc4f73dc56ae56e82b6abdd9862' }, h("hr", { key: 'adf57dd7a3e142aa966cf83863bf54652f1f19e4' }), h("div", { key: '11677f462af966ee5c5253a7e0bdb9ed6ab90a07' }, "LifecycleAsyncC ", this.value), h("div", { key: '5b8733623cffa6c0d870e2f92f68ad881b2cbd97', class: "rendered-c" }, "rendered c: ", this.rendered)));
    }
}, [0, "lifecycle-async-c", {
        "value": [1]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["lifecycle-async-c"];
    components.forEach(tagName => { switch (tagName) {
        case "lifecycle-async-c":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), LifecycleAsyncC);
            }
            break;
    } });
}

export { LifecycleAsyncC as L, defineCustomElement as d, timeout as t };
