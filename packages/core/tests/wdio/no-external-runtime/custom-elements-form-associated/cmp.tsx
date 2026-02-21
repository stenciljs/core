import { AttachInternals, Component, h } from '@stencil/core';

@Component({
  tag: 'custom-elements-form-associated',
  formAssociated: true,
  shadow: true,
})
export class CustomElementsFormAssociated {
  @AttachInternals() internals: ElementInternals;

  componentWillLoad() {
    this.internals.setFormValue('my default value');
  }

  formAssociatedCallback(form: HTMLCustomElementsFormAssociatedElement) {
    form.ariaLabel = 'formAssociated called';
    // this is a regression test for #5106 which ensures that `this` is
    // resolved correctly
    this.internals.setValidity({});
  }

  render() {
    return <input type="text" />;
  }
}
