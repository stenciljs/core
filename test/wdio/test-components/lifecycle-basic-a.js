import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$3 } from './p-BiIaVCPZ.js';
import { d as defineCustomElement$2 } from './p-BPMgzNMJ.js';

const LifecycleBasicA$1 = /*@__PURE__*/ proxyCustomElement(class LifecycleBasicA extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.value = '';
        this.rendered = 0;
        this.loads = [];
        this.updates = [];
        this.componentWillUpdated = false;
        this.componentDidUpdated = false;
    }
    lifecycleLoad(ev) {
        this.loads = [...this.loads, ev.detail];
    }
    lifecycleUpdate(ev) {
        this.updates = [...this.updates, ev.detail];
    }
    componentWillLoad() {
        this.loads = [...this.loads, 'componentWillLoad-a'];
    }
    componentDidLoad() {
        this.loads = [...this.loads, 'componentDidLoad-a'];
    }
    componentWillUpdate() {
        if (this.value === 'Updated' && !this.componentWillUpdated) {
            this.updates = [...this.updates, 'componentWillUpdate-a'];
            this.componentWillUpdated = true;
        }
    }
    componentDidUpdate() {
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
        return (h("div", { key: '33e45d86c62072531c278a4f6e988b2ec3ae56ef' }, h("button", { key: '0f8322b990ca7d3675e8bf24dd3238f94498b4d0', onClick: this.testClick.bind(this), class: "test" }, "Update"), h("hr", { key: '7355533f67075d73b339bceb8e6874ce0d140e98' }), h("div", { key: 'b87e4e17701a45e2c71e9b7811f47a309ecc4dff' }, "LifecycleBasicA ", this.value), h("div", { key: '7142a2643db49001f14bbd361b2e347f2829dde9', class: "rendered-a" }, "rendered a: ", this.rendered), h("div", { key: '2822d8735ef96e6af19ee04183636de8e5161f8f' }, "loads a:"), h("ol", { key: 'b254d9c51df1092bc64799ad2d8d2f49ad2fc903', class: "lifecycle-loads-a" }, this.loads.map((load) => {
            return h("li", null, load);
        })), h("div", { key: '08d7f2232ea2c2c97239fa6ccd57c585abd9ed57' }, "updates a:"), h("ol", { key: '204fff120afdde971c289988f8fb256adb4109ea', class: "lifecycle-updates-a" }, this.updates.map((update) => {
            return h("li", null, update);
        })), h("lifecycle-basic-b", { key: 'a37c40823132cd471f6b8e13eac5360f0652052c', value: this.value })));
    }
}, [0, "lifecycle-basic-a", {
        "value": [32],
        "rendered": [32],
        "loads": [32],
        "updates": [32]
    }, [[0, "lifecycleLoad", "lifecycleLoad"], [0, "lifecycleUpdate", "lifecycleUpdate"]]]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["lifecycle-basic-a", "lifecycle-basic-b", "lifecycle-basic-c"];
    components.forEach(tagName => { switch (tagName) {
        case "lifecycle-basic-a":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), LifecycleBasicA$1);
            }
            break;
        case "lifecycle-basic-b":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$3();
            }
            break;
        case "lifecycle-basic-c":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const LifecycleBasicA = LifecycleBasicA$1;
const defineCustomElement = defineCustomElement$1;

export { LifecycleBasicA, defineCustomElement };
