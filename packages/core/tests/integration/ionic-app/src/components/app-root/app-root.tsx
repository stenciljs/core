import { Component, h } from '@stencil/core';

@Component({
  tag: 'app-root',
  styleUrl: 'app-root.css',
})
export class AppRoot {
  render() {
    return (
      <ion-app>
        <ion-router useHash={false}>
          <ion-route url="/" component="app-home" />
          <ion-route url="/profile/:name" component="app-profile" />
        </ion-router>

        <ion-split-pane contentId="main" when="sm">
          <ion-menu contentId="main">
            <ion-header>
              <ion-toolbar color="primary">
                <ion-title>Ionic PWA</ion-title>
              </ion-toolbar>
            </ion-header>
            <ion-content>
              <ion-list>
                <ion-list-header>
                  <ion-label>Navigation</ion-label>
                </ion-list-header>
                <ion-menu-toggle autoHide={false}>
                  <ion-item href="/">
                    <ion-icon slot="start" name="home" />
                    <ion-label>Home</ion-label>
                  </ion-item>
                </ion-menu-toggle>
                <ion-menu-toggle autoHide={false}>
                  <ion-item href="/profile/ionic">
                    <ion-icon slot="start" name="person" />
                    <ion-label>Ionic's Profile</ion-label>
                  </ion-item>
                </ion-menu-toggle>
              </ion-list>
            </ion-content>
          </ion-menu>

          <ion-nav id="main" />
        </ion-split-pane>
      </ion-app>
    );
  }
}
