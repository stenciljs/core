import { H, p as proxyCustomElement, h, t as transformTag } from './p-DYdAJnXF.js';

const ConflictsBase = class extends H {
    constructor() {
        super(false);
        // Duplicate properties that will be overridden in component
        this.duplicateProp = 'base prop value';
        this.duplicateState = 'base state value';
        // Non-duplicate properties for comparison
        this.baseOnlyProp = 'base only prop value';
        this.baseOnlyState = 'base only state value';
        // Tracking mechanism to verify which method is called
        this.methodCallLog = [];
    }
    /**
     * Duplicate method that will be overridden in component
     */
    async duplicateMethod() {
        this.methodCallLog.push('duplicateMethod:base');
        return 'base method';
    }
    /**
     * Non-duplicate method for comparison
     */
    async baseOnlyMethod() {
        this.methodCallLog.push('baseOnlyMethod');
        return 'base only method';
    }
    /**
     * Method to get the call log for testing
     */
    async getMethodCallLog() {
        return [...this.methodCallLog];
    }
    /**
     * Method to reset call log for testing
     */
    async resetMethodCallLog() {
        this.methodCallLog = [];
    }
};

const ConflictsCmp = /*@__PURE__*/ proxyCustomElement(class ConflictsCmp extends ConflictsBase {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
        // Duplicate @Prop - same name as base, should override
        this.duplicateProp = 'component prop value';
        // Duplicate @State - same name as base, should override
        this.duplicateState = 'component state value';
        // Component-specific properties
        this.componentOnlyState = 'component only state';
        // Tracking mechanism for component method calls
        this.componentMethodCallLog = [];
    }
    /**
     * Duplicate method - same name as base, should override
     * Component version should be called, not base version
     */
    async duplicateMethod() {
        this.componentMethodCallLog.push('duplicateMethod:component');
        return 'component method';
    }
    /**
     * Method to update duplicate state for testing
     */
    async updateDuplicateState(value) {
        this.duplicateState = value;
    }
    /**
     * Method to update component-only state
     */
    async updateComponentOnlyState(value) {
        this.componentOnlyState = value;
    }
    /**
     * Method to get component method call log
     */
    async getComponentMethodCallLog() {
        return [...this.componentMethodCallLog];
    }
    /**
     * Method to reset component call log
     */
    async resetComponentMethodCallLog() {
        this.componentMethodCallLog = [];
    }
    /**
     * Method to get combined call log (base + component)
     */
    async getCombinedMethodCallLog() {
        const baseLog = await super.getMethodCallLog();
        return [...baseLog, ...this.componentMethodCallLog];
    }
    /**
     * Method to reset all call logs
     */
    async resetAllCallLogs() {
        await super.resetMethodCallLog();
        this.componentMethodCallLog = [];
    }
    render() {
        return (h("div", { key: 'a7a026450dacc04985d632f065093943724eb665', class: "container" }, h("h2", { key: 'd17f668d3203f1ada6ec4d231f790af8b6054b17' }, "Decorator Conflicts Test"), h("div", { key: '3d450110d4e5b909331f7a8194f201eeb11b7899', class: "duplicate-props" }, h("h3", { key: '4d40b87494e39b76c22943ddf2759ae57a78ef63' }, "Duplicate @Prop (Component Override)"), h("p", { key: 'f3bc11037219e35578bfea6095757d53346b073b', class: "duplicate-prop-value" }, "Duplicate Prop: ", this.duplicateProp), h("p", { key: '2dd16068e75f6533e0bed487ce5b2238ac7defe5', class: "expected-prop-value" }, "Expected: component prop value (component override)")), h("div", { key: '040fb6522ed82dbc1ce488b507d2dfac9cbc757e', class: "duplicate-states" }, h("h3", { key: 'bc8340387f9576a23b6ca61d920b8f95ccb980a1' }, "Duplicate @State (Component Override)"), h("p", { key: '1051e1ef694a765b2043add1601c43de88f969e9', class: "duplicate-state-value" }, "Duplicate State: ", this.duplicateState), h("p", { key: '4f2cfd29d1cba827b2db0ad8a2b479d1252ad70b', class: "expected-state-value" }, "Expected: component state value (component override)")), h("div", { key: '3072ae8f5e99ea8884887cc3b95e113d64c7c44a', class: "base-only-props" }, h("h3", { key: '2d815d9115f2592bad4a2189074da1717dea13e1' }, "Base-Only Properties (Not Duplicated)"), h("p", { key: '62e6c93ebb93caeb180af248f63d94370a21eae9', class: "base-only-prop-value" }, "Base Only Prop: ", this.baseOnlyProp), h("p", { key: '79622c596bc378c2367c49e3e495e0dd28818eda', class: "base-only-state-value" }, "Base Only State: ", this.baseOnlyState)), h("div", { key: 'd055ed5db08c99983c067d439e77012414a84de9', class: "component-only-state" }, h("h3", { key: '652ad9b08c3c29188c2b49a4e202ede2fd7eaf9b' }, "Component-Only State"), h("p", { key: '0c2666e92514030196e550f70555377ce0eb6eb2', class: "component-only-state-value" }, "Component Only State: ", this.componentOnlyState)), h("div", { key: '10cad39178842869f66724cf249c140c610e07fe', class: "actions" }, h("button", { key: '5638bbc4b05dea86c3f67125dff49f987d8bba6d', class: "update-duplicate-state", onClick: () => this.updateDuplicateState('duplicate state updated') }, "Update Duplicate State"), h("button", { key: 'b9cda4c6e451bded3fb45c9a8deed4e3f645edbc', class: "update-component-only-state", onClick: () => this.updateComponentOnlyState('component only updated') }, "Update Component Only State")), h("div", { key: 'fe6ff27054594a8ac5e5bf16b1d40739fb5bf98d', class: "test-info" }, h("p", { key: 'd4a54dd9c9eef94aa70bffdd256e56532b798e40' }, "Features: Duplicate @Prop names | Duplicate @State names | Duplicate @Method names | Compiler precedence rules"))));
    }
    get el() { return this; }
}, [512, "extends-conflicts", {
        "baseOnlyProp": [1, "base-only-prop"],
        "duplicateProp": [1, "duplicate-prop"],
        "baseOnlyState": [32],
        "duplicateState": [32],
        "componentOnlyState": [32],
        "baseOnlyMethod": [64],
        "getMethodCallLog": [64],
        "resetMethodCallLog": [64],
        "duplicateMethod": [64],
        "updateDuplicateState": [64],
        "updateComponentOnlyState": [64],
        "getComponentMethodCallLog": [64],
        "resetComponentMethodCallLog": [64],
        "getCombinedMethodCallLog": [64],
        "resetAllCallLogs": [64]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["extends-conflicts"];
    components.forEach(tagName => { switch (tagName) {
        case "extends-conflicts":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ConflictsCmp);
            }
            break;
    } });
}

const ExtendsConflicts = ConflictsCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsConflicts, defineCustomElement };
