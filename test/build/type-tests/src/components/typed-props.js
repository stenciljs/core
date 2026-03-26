var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d;
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return (c > 3 && r && Object.defineProperty(target, key, r), r);
  };
import { Component, Prop, h } from '@stencil/core';
/**
 * A component with various typed props for testing JSX type inference.
 */
let TypedProps = class TypedProps {
  /** String prop with default */
  strWithDefault = 'hello';
  /** Optional string prop */
  strOptional;
  /** Required string prop */
  strRequired;
  /** Number prop with default */
  numWithDefault = 42;
  /** Optional number prop */
  numOptional;
  /** Boolean prop with default */
  boolWithDefault = false;
  /** Optional boolean prop */
  boolOptional;
  /** Object prop */
  objProp;
  /** Array prop */
  arrProp;
  /** Union type prop */
  unionProp;
  render() {
    return h(
      'div',
      null,
      h('span', null, this.strWithDefault),
      h('span', null, this.numWithDefault),
    );
  }
};
__decorate([Prop()], TypedProps.prototype, 'strWithDefault', void 0);
__decorate([Prop()], TypedProps.prototype, 'strOptional', void 0);
__decorate([Prop()], TypedProps.prototype, 'strRequired', void 0);
__decorate([Prop()], TypedProps.prototype, 'numWithDefault', void 0);
__decorate([Prop()], TypedProps.prototype, 'numOptional', void 0);
__decorate([Prop()], TypedProps.prototype, 'boolWithDefault', void 0);
__decorate([Prop()], TypedProps.prototype, 'boolOptional', void 0);
__decorate([Prop()], TypedProps.prototype, 'objProp', void 0);
__decorate([Prop()], TypedProps.prototype, 'arrProp', void 0);
__decorate([Prop()], TypedProps.prototype, 'unionProp', void 0);
TypedProps = __decorate(
  [
    Component({
      tag: 'typed-props',
    }),
  ],
  TypedProps,
);
export { TypedProps };
