import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$3 } from './p-B3_rbdkD.js';
import { d as defineCustomElement$2 } from './p-EcrEM3zD.js';

const LifecycleAsyncA$1 = /*@__PURE__*/ proxyCustomElement(class LifecycleAsyncA extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.value = '';
        this.loads = [];
        this.updates = [];
        this.rendered = 0;
        this.componentWillUpdated = false;
        this.componentDidUpdated = false;
    }
    lifecycleLoad(ev) {
        this.loads = [...this.loads, ev.detail];
    }
    lifecycleUpdate(ev) {
        this.updates = [...this.updates, ev.detail];
    }
    async componentWillLoad() {
        this.loads = [...this.loads, 'componentWillLoad-a'];
    }
    async componentDidLoad() {
        this.loads = [...this.loads, 'componentDidLoad-a'];
    }
    async componentWillUpdate() {
        if (this.value === 'Updated' && !this.componentWillUpdated) {
            this.updates = [...this.updates, 'componentWillUpdate-a'];
            this.componentWillUpdated = true;
        }
    }
    async componentDidUpdate() {
        if (this.value === 'Updated' && !this.componentDidUpdated) {
            this.updates = [...this.updates, 'componentDidUpdate-a'];
            this.componentDidUpdated = true;
        }
    }
    testClick() {
        this.value = 'Updated';
    }
    render() {
        this.rendered++;
        return (h("div", { key: '06d45d1e10b5046e22dc7d9b05b0bf7e91b3cf14' }, h("button", { key: 'e0455dd93447be44566f0bb1cf3e2a863a6539e7', onClick: this.testClick.bind(this), class: "test" }, "Update"), h("hr", { key: '9e823052422944c05f7e694d2ae137cb56755e62' }), h("div", { key: '56ee34d8496af1f97fd24a205eec92cd33937b8d' }, "LifecycleAsyncA ", this.value), h("div", { key: '107a7ae2fe940b55a32301553ae18194aeed6a4a', class: "rendered-a" }, "rendered a: ", this.rendered), h("div", { key: '86b4f71ef0ed8fc1f69b4fd14ee8d20080fb57cf' }, "loads a:"), h("ol", { key: '28562b7eabfe993004182a49fcfd8564c4e678fe', class: "lifecycle-loads-a" }, this.loads.map((load) => {
            return h("li", null, load);
        })), h("div", { key: 'fb9fdff19f4061f45b8d8c8d06b43e7ddefdd134' }, "updates a:"), h("ol", { key: '5e4a9aba98a6d77a43e8a3d121b0e7f993556a30', class: "lifecycle-updates-a" }, this.updates.map((update) => {
            return h("li", null, update);
        })), h("lifecycle-async-b", { key: 'fc608351c6038e24b21beaa537423ccca873ff13', value: this.value })));
    }
}, [0, "lifecycle-async-a", {
        "value": [32],
        "loads": [32],
        "updates": [32]
    }, [[0, "lifecycleLoad", "lifecycleLoad"], [0, "lifecycleUpdate", "lifecycleUpdate"]]]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["lifecycle-async-a", "lifecycle-async-b", "lifecycle-async-c"];
    components.forEach(tagName => { switch (tagName) {
        case "lifecycle-async-a":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), LifecycleAsyncA$1);
            }
            break;
        case "lifecycle-async-b":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$3();
            }
            break;
        case "lifecycle-async-c":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const LifecycleAsyncA = LifecycleAsyncA$1;
const defineCustomElement = defineCustomElement$1;

export { LifecycleAsyncA, defineCustomElement };
