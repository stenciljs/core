import { AttachInternals, Component, h } from '@stencil/core';

@Component({
  tag: 'form-associated-external',

  encapsulation: { type: 'shadow' },
})
export class FormAssociatedExternal {
  @AttachInternals() internals: ElementInternals;

  componentWillLoad() {
    this.internals.setFormValue('my default value');
  }

  formAssociatedCallback(form: HTMLFormElement) {
    form.ariaLabel = 'formAssociated called';
    // Regression test for #5106 - ensures `this` is resolved correctly
    this.internals.setValidity({});
  }

  formResetCallback() {
    const form = this.internals.form;
    if (form) {
      form.ariaLabel = 'formResetCallback called';
    }
  }

  formDisabledCallback(disabled: boolean) {
    const form = this.internals.form;
    if (form) {
      form.ariaLabel = `formDisabledCallback called with ${disabled}`;
    }
  }

  render() {
    return <input type='text' />;
  }
}
