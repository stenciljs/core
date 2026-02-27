import { p as proxyCustomElement, H, e as createEvent, h, t as transformTag } from './p-DYdAJnXF.js';

const FormAssociatedCmp = /*@__PURE__*/ proxyCustomElement(class FormAssociatedCmp extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.myEvent = createEvent(this, "myEvent");
        this.internals = this.attachInternals();
        this.changeCount = 0;
        this.methodCalledCount = 0;
        this.eventCaughtCount = 0;
    }
    onMyEventTriggered() {
        this.eventCaughtCount += 1;
    }
    onNameChange() {
        this.changeCount += 1;
    }
    async myMethod() {
        this.methodCalledCount += 1;
        this.myEvent.emit();
        return this.el;
    }
    componentWillLoad() {
        this.internals.setFormValue('my default value');
    }
    render() {
        return [
            h("p", { key: '14f4df472ef3045129f047aed4d32403eedffdf1' }, "My name is ", this.user),
            h("p", { key: '1618969c25cabf293cf13b24d9bd5b172e2c1965' }, "Name changed ", this.changeCount, " time(s)"),
            h("p", { key: 'cb4a69407aa537ce0ff0fa5db207cfa231335165' }, "Method called ", this.methodCalledCount, " time(s)"),
            h("p", { key: '6265b84382ab85d614bf98170e37cfc3b2206a0b' }, "Event triggered ", this.eventCaughtCount, " time(s)"),
        ];
    }
    static get formAssociated() { return true; }
    get el() { return this; }
    static get watchers() { return {
        "user": [{
                "onNameChange": 0
            }]
    }; }
}, [64, "import-aliasing", {
        "user": [1],
        "changeCount": [32],
        "methodCalledCount": [32],
        "eventCaughtCount": [32],
        "myMethod": [64]
    }, [[0, "myEvent", "onMyEventTriggered"]], {
        "user": [{
                "onNameChange": 0
            }]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["import-aliasing"];
    components.forEach(tagName => { switch (tagName) {
        case "import-aliasing":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), FormAssociatedCmp);
            }
            break;
    } });
}

const ImportAliasing = FormAssociatedCmp;
const defineCustomElement = defineCustomElement$1;

export { ImportAliasing, defineCustomElement };
