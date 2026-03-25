import { Component, Prop, h } from '@stencil/core';

/**
 * A component with various typed props for testing JSX type inference.
 */
@Component({
  tag: 'typed-props',
})
export class TypedProps {
  /** String prop with default */
  @Prop() strWithDefault = 'hello';

  /** Optional string prop */
  @Prop() strOptional?: string;

  /** Required string prop */
  @Prop() strRequired!: string;

  /** Number prop with default */
  @Prop() numWithDefault = 42;

  /** Optional number prop */
  @Prop() numOptional?: number;

  /** Boolean prop with default */
  @Prop() boolWithDefault = false;

  /** Optional boolean prop */
  @Prop() boolOptional?: boolean;

  /** Object prop */
  @Prop() objProp?: { name: string; value: number };

  /** Array prop */
  @Prop() arrProp?: string[];

  /** Union type prop */
  @Prop() unionProp?: 'small' | 'medium' | 'large';

  render() {
    return (
      <div>
        <span>{this.strWithDefault}</span>
        <span>{this.numWithDefault}</span>
      </div>
    );
  }
}
