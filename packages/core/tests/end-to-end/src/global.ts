import { setMode } from '@stencil/core';

export default function () {
  setMode((elm) => {
    return elm.getAttribute('mode');
  });
}
