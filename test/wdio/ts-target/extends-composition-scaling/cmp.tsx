import { Component, h } from '@stencil/core';

/**
 * Main component that demonstrates composition-based scaling
 * with 3 components and 2 controllers (ValidationController and FocusController)
 */
@Component({
  tag: 'composition-scaling-demo',
  styles: `
    :host {
      display: block;
      padding: 20px;
      font-family: Arial, sans-serif;
    }
    
    .demo-container {
      max-width: 600px;
      margin: 0 auto;
    }
    
    .component-section {
      margin: 30px 0;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    .text-input-container,
    .radio-group-container,
    .checkbox-group-container {
      margin: 10px 0;
    }
    
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: bold;
    }
    
    input[type="text"] {
      width: 100%;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-sizing: border-box;
    }
    
    input[type="text"].invalid {
      border-color: #f00;
    }
    
    .radio-group,
    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .radio-group label,
    .checkbox-group label {
      display: flex;
      align-items: center;
      font-weight: normal;
      cursor: pointer;
    }
    
    .radio-group input[type="radio"],
    .checkbox-group input[type="checkbox"] {
      margin-right: 8px;
    }
    
    .validation-message {
      margin-top: 8px;
    }
    
    .error-text {
      color: #f00;
      font-size: 0.875em;
    }
    
    .focus-info {
      margin-top: 8px;
      font-size: 0.875em;
      color: #666;
    }
    
    h1 {
      text-align: center;
      color: #333;
    }
    
    h2 {
      color: #555;
      margin-top: 0;
    }
  `,
})
export class CompositionScalingDemo {
  render() {
    return (
      <div class="demo-container">
        <h1>Composition-Based Scaling Demo</h1>
        <p>
          This demo shows 3 components (TextInput, RadioGroup, CheckboxGroup) 
          using 2 controllers (ValidationController, FocusController) via composition.
        </p>
        
        <div class="component-section">
          <h2>Text Input Component</h2>
          <composition-text-input />
        </div>
        
        <div class="component-section">
          <h2>Radio Group Component</h2>
          <composition-radio-group />
        </div>
        
        <div class="component-section">
          <h2>Checkbox Group Component</h2>
          <composition-checkbox-group />
        </div>
      </div>
    );
  }
}

