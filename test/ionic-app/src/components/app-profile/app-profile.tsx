import { Component, Host, Prop, State, h } from '@stencil/core';
import { sayHello } from '../../helpers/utils';

@Component({
  tag: 'app-profile',
})
export class AppProfile {
  @State() state = false;
  @Prop() name: string;

  formattedName(): string {
    if (this.name) {
      return this.name.slice(0, 1).toUpperCase() + this.name.slice(1).toLowerCase();
    }
    return '';
  }

  render() {
    return (
      <Host>
        <ion-header>
          <ion-toolbar color="primary">
            <ion-buttons slot="start">
              <ion-back-button defaultHref="/" />
            </ion-buttons>
            <ion-title>Profile: {this.name}</ion-title>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          <p>
            {sayHello()}! My name is {this.formattedName()}. My name was passed in through a route param!
          </p>

          <ion-item>
            <ion-label>Setting ({this.state.toString()})</ion-label>
            <ion-toggle checked={this.state} onIonChange={(ev) => (this.state = ev.detail.checked)} />
          </ion-item>
        </ion-content>
      </Host>
    );
  }
}
