import { Component, h, State } from '@stencil/core';
import { RenderBase } from './render-base.js';

/**
 * Test Case #5: Render Method Inheritance
 * 
 * This component extends RenderBase to test:
 * - Render Inheritance: Component render() method calls super.render() to include parent template
 * - Template Composition: Component composes parent template with additional content and structure
 * - Slot Integration: Parent template slots work correctly when inherited and extended
 * - CSS Class Inheritance: CSS classes from parent template maintained in component extension
 */
@Component({
  tag: 'extends-render',
})
export class RenderCmp extends RenderBase {
  @State() componentTitle: string = 'Extended Component';
  @State() additionalContent: string = 'Additional component content';

  // Override base class properties
  componentWillLoad() {
    this.baseTitle = 'Extended Base Title';
    this.baseClass = 'base-container extended';
  }

  /**
   * Render method that composes parent template with child content
   * Uses super.render() to include base template, then wraps it with additional structure
   */
  render() {
    // Compose parent template (via super.render()) with additional wrapper and content
    return (
      <div class="component-wrapper">
        <div class="component-header">
          <h2 class="component-title">{this.componentTitle}</h2>
        </div>
        
        {/* Include base render (with slots and CSS classes) - calls super.render() */}
        {super.render()}
        
        {/* Additional component-specific content */}
        <div class="component-additional">
          <p class="additional-content">{this.additionalContent}</p>
        </div>
      </div>
    );
  }
}

