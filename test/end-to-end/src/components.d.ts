/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
import { CarData, } from "./car-list/car-data";
export namespace Components {
    interface AppRoot {
    }
    interface BuildData {
    }
    interface CarDetail {
        "car": CarData;
    }
    interface CarList {
        "cars": CarData[];
        "selected": CarData;
    }
    interface DomApi {
    }
    interface DomInteraction {
    }
    interface DomVisible {
    }
    interface ElementCmp {
    }
    interface EventCmp {
        "methodThatFiresEventWithOptions": () => Promise<void>;
        "methodThatFiresMyDocumentEvent": () => Promise<void>;
        "methodThatFiresMyWindowEvent": (value: number) => Promise<void>;
    }
    interface ListenCmp {
        "opened": boolean;
    }
    interface MethodCmp {
        "someMethod": () => Promise<number>;
        "someMethodWithArgs": (unit: string, value: number) => Promise<string>;
        "someProp": number;
    }
    interface PathAliasCmp {
    }
    interface PropCmp {
        "first": string;
        "lastName": string;
        /**
          * Mode
         */
        "mode"?: any;
    }
    interface SlotCmp {
    }
    interface SlotCmpContainer {
    }
    interface SlotParentCmp {
        "label": string;
    }
    interface StateCmp {
    }
}
declare global {
    interface HTMLAppRootElement extends Components.AppRoot, HTMLStencilElement {
    }
    var HTMLAppRootElement: {
        prototype: HTMLAppRootElement;
        new (): HTMLAppRootElement;
    };
    interface HTMLBuildDataElement extends Components.BuildData, HTMLStencilElement {
    }
    var HTMLBuildDataElement: {
        prototype: HTMLBuildDataElement;
        new (): HTMLBuildDataElement;
    };
    interface HTMLCarDetailElement extends Components.CarDetail, HTMLStencilElement {
    }
    var HTMLCarDetailElement: {
        prototype: HTMLCarDetailElement;
        new (): HTMLCarDetailElement;
    };
    interface HTMLCarListElement extends Components.CarList, HTMLStencilElement {
    }
    var HTMLCarListElement: {
        prototype: HTMLCarListElement;
        new (): HTMLCarListElement;
    };
    interface HTMLDomApiElement extends Components.DomApi, HTMLStencilElement {
    }
    var HTMLDomApiElement: {
        prototype: HTMLDomApiElement;
        new (): HTMLDomApiElement;
    };
    interface HTMLDomInteractionElement extends Components.DomInteraction, HTMLStencilElement {
    }
    var HTMLDomInteractionElement: {
        prototype: HTMLDomInteractionElement;
        new (): HTMLDomInteractionElement;
    };
    interface HTMLDomVisibleElement extends Components.DomVisible, HTMLStencilElement {
    }
    var HTMLDomVisibleElement: {
        prototype: HTMLDomVisibleElement;
        new (): HTMLDomVisibleElement;
    };
    interface HTMLElementCmpElement extends Components.ElementCmp, HTMLStencilElement {
    }
    var HTMLElementCmpElement: {
        prototype: HTMLElementCmpElement;
        new (): HTMLElementCmpElement;
    };
    interface HTMLEventCmpElement extends Components.EventCmp, HTMLStencilElement {
    }
    var HTMLEventCmpElement: {
        prototype: HTMLEventCmpElement;
        new (): HTMLEventCmpElement;
    };
    interface HTMLListenCmpElement extends Components.ListenCmp, HTMLStencilElement {
    }
    var HTMLListenCmpElement: {
        prototype: HTMLListenCmpElement;
        new (): HTMLListenCmpElement;
    };
    interface HTMLMethodCmpElement extends Components.MethodCmp, HTMLStencilElement {
    }
    var HTMLMethodCmpElement: {
        prototype: HTMLMethodCmpElement;
        new (): HTMLMethodCmpElement;
    };
    interface HTMLPathAliasCmpElement extends Components.PathAliasCmp, HTMLStencilElement {
    }
    var HTMLPathAliasCmpElement: {
        prototype: HTMLPathAliasCmpElement;
        new (): HTMLPathAliasCmpElement;
    };
    interface HTMLPropCmpElement extends Components.PropCmp, HTMLStencilElement {
    }
    var HTMLPropCmpElement: {
        prototype: HTMLPropCmpElement;
        new (): HTMLPropCmpElement;
    };
    interface HTMLSlotCmpElement extends Components.SlotCmp, HTMLStencilElement {
    }
    var HTMLSlotCmpElement: {
        prototype: HTMLSlotCmpElement;
        new (): HTMLSlotCmpElement;
    };
    interface HTMLSlotCmpContainerElement extends Components.SlotCmpContainer, HTMLStencilElement {
    }
    var HTMLSlotCmpContainerElement: {
        prototype: HTMLSlotCmpContainerElement;
        new (): HTMLSlotCmpContainerElement;
    };
    interface HTMLSlotParentCmpElement extends Components.SlotParentCmp, HTMLStencilElement {
    }
    var HTMLSlotParentCmpElement: {
        prototype: HTMLSlotParentCmpElement;
        new (): HTMLSlotParentCmpElement;
    };
    interface HTMLStateCmpElement extends Components.StateCmp, HTMLStencilElement {
    }
    var HTMLStateCmpElement: {
        prototype: HTMLStateCmpElement;
        new (): HTMLStateCmpElement;
    };
    interface HTMLElementTagNameMap {
        "app-root": HTMLAppRootElement;
        "build-data": HTMLBuildDataElement;
        "car-detail": HTMLCarDetailElement;
        "car-list": HTMLCarListElement;
        "dom-api": HTMLDomApiElement;
        "dom-interaction": HTMLDomInteractionElement;
        "dom-visible": HTMLDomVisibleElement;
        "element-cmp": HTMLElementCmpElement;
        "event-cmp": HTMLEventCmpElement;
        "listen-cmp": HTMLListenCmpElement;
        "method-cmp": HTMLMethodCmpElement;
        "path-alias-cmp": HTMLPathAliasCmpElement;
        "prop-cmp": HTMLPropCmpElement;
        "slot-cmp": HTMLSlotCmpElement;
        "slot-cmp-container": HTMLSlotCmpContainerElement;
        "slot-parent-cmp": HTMLSlotParentCmpElement;
        "state-cmp": HTMLStateCmpElement;
    }
}
declare namespace LocalJSX {
    interface AppRoot {
    }
    interface BuildData {
    }
    interface CarDetail {
        "car"?: CarData;
    }
    interface CarList {
        "cars"?: CarData[];
        "onCarSelected"?: (event: CustomEvent<CarData>) => void;
        "selected"?: CarData;
    }
    interface DomApi {
    }
    interface DomInteraction {
    }
    interface DomVisible {
    }
    interface ElementCmp {
    }
    interface EventCmp {
        "onMy-event-with-options"?: (event: CustomEvent<{
            mph: number;
        }>) => void;
        "onMyDocumentEvent"?: (event: CustomEvent<any>) => void;
        "onMyWindowEvent"?: (event: CustomEvent<number>) => void;
    }
    interface ListenCmp {
        "opened"?: boolean;
    }
    interface MethodCmp {
        "someProp"?: number;
    }
    interface PathAliasCmp {
    }
    interface PropCmp {
        "first"?: string;
        "lastName"?: string;
        /**
          * Mode
         */
        "mode"?: any;
    }
    interface SlotCmp {
    }
    interface SlotCmpContainer {
    }
    interface SlotParentCmp {
        "label"?: string;
    }
    interface StateCmp {
    }
    interface IntrinsicElements {
        "app-root": AppRoot;
        "build-data": BuildData;
        "car-detail": CarDetail;
        "car-list": CarList;
        "dom-api": DomApi;
        "dom-interaction": DomInteraction;
        "dom-visible": DomVisible;
        "element-cmp": ElementCmp;
        "event-cmp": EventCmp;
        "listen-cmp": ListenCmp;
        "method-cmp": MethodCmp;
        "path-alias-cmp": PathAliasCmp;
        "prop-cmp": PropCmp;
        "slot-cmp": SlotCmp;
        "slot-cmp-container": SlotCmpContainer;
        "slot-parent-cmp": SlotParentCmp;
        "state-cmp": StateCmp;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "app-root": LocalJSX.AppRoot & JSXBase.HTMLAttributes<HTMLAppRootElement>;
            "build-data": LocalJSX.BuildData & JSXBase.HTMLAttributes<HTMLBuildDataElement>;
            "car-detail": LocalJSX.CarDetail & JSXBase.HTMLAttributes<HTMLCarDetailElement>;
            "car-list": LocalJSX.CarList & JSXBase.HTMLAttributes<HTMLCarListElement>;
            "dom-api": LocalJSX.DomApi & JSXBase.HTMLAttributes<HTMLDomApiElement>;
            "dom-interaction": LocalJSX.DomInteraction & JSXBase.HTMLAttributes<HTMLDomInteractionElement>;
            "dom-visible": LocalJSX.DomVisible & JSXBase.HTMLAttributes<HTMLDomVisibleElement>;
            "element-cmp": LocalJSX.ElementCmp & JSXBase.HTMLAttributes<HTMLElementCmpElement>;
            "event-cmp": LocalJSX.EventCmp & JSXBase.HTMLAttributes<HTMLEventCmpElement>;
            "listen-cmp": LocalJSX.ListenCmp & JSXBase.HTMLAttributes<HTMLListenCmpElement>;
            "method-cmp": LocalJSX.MethodCmp & JSXBase.HTMLAttributes<HTMLMethodCmpElement>;
            "path-alias-cmp": LocalJSX.PathAliasCmp & JSXBase.HTMLAttributes<HTMLPathAliasCmpElement>;
            "prop-cmp": LocalJSX.PropCmp & JSXBase.HTMLAttributes<HTMLPropCmpElement>;
            "slot-cmp": LocalJSX.SlotCmp & JSXBase.HTMLAttributes<HTMLSlotCmpElement>;
            "slot-cmp-container": LocalJSX.SlotCmpContainer & JSXBase.HTMLAttributes<HTMLSlotCmpContainerElement>;
            "slot-parent-cmp": LocalJSX.SlotParentCmp & JSXBase.HTMLAttributes<HTMLSlotParentCmpElement>;
            "state-cmp": LocalJSX.StateCmp & JSXBase.HTMLAttributes<HTMLStateCmpElement>;
        }
    }
}
