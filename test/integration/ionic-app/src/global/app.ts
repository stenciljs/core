import '@ionic/core';
// import { setupConfig } from '@ionic/core';

export default () => {
  // setupConfig({
  //   mode: 'ios'
  // });
};

window.addEventListener('appload', () => {
  document.getElementsByTagName('html')[0].classList.add('hydrated');
});
