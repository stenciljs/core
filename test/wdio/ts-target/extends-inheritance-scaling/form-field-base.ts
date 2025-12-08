/**
 * FormFieldBase - combines ValidationControllerMixin and FocusControllerMixin
 * 
 * This base class demonstrates how multiple controllers can be combined
 * via Mixin (multiple inheritance). Components can extend this to get both
 * validation and focus management functionality.
 */
import { Mixin } from '@stencil/core';
import { ValidationControllerMixin } from './validation-controller-mixin.js';
import { FocusControllerMixin } from './focus-controller-mixin.js';

export abstract class FormFieldBase extends Mixin(ValidationControllerMixin, FocusControllerMixin) {
  // Convenience methods that combine both controllers
  handleFocusEvent() {
    this.handleFocus(); // From FocusControllerMixin
  }
  
  handleBlurEvent(value: any) {
    this.handleBlur(); // From FocusControllerMixin (no params)
    this.validate(value); // From ValidationControllerMixin
  }
}

