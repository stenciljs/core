import { setMode } from '@stencil/core';

const global = () => {
  setMode(
    (elm: any) => elm.mode || elm.getAttribute('mode') || document.documentElement.getAttribute('mode') || 'buford',
  );
};
export default global;
