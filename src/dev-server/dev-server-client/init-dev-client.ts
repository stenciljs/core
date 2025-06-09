import type * as d from '../../declarations';
import { initBuildProgress, initBuildStatus } from '../client';
import * as c from '../dev-server-constants';
import { appReset, initAppUpdate } from './app-update';
import { initClientWebSocket } from './client-web-socket';

export const initDevClient = (win: d.DevClientWindow, config: d.DevClientConfig) => {
  try {
    if (win['s-dev-server']) {
      // somehow we've already initialized the dev server client-side script
      // don't bother doing it again (this shouldn't happen)
      return;
    }
    win['s-dev-server'] = true;

    initBuildStatus({ window: win });
    initBuildProgress({ window: win });
    initAppUpdate(win, config);

    if (isInitialDevServerLoad(win, config)) {
      win['s-initial-load'] = true;
      // this page is the initial dev server load page
      // we currently have an ugly url like /~dev-server-init
      // or something, let's quickly change that using
      // history.replaceState() and update the url to
      // what's expected like /
      // we're doing this so we can force the server
      // worker to unregister, but do not fully reload the page yet
      appReset(win, config, () => {
        initClientWebSocket(win, config);
      });
    } else {
      initClientWebSocket(win, config);
    }
  } catch (e) {
    console.error(e);
  }
};

const isInitialDevServerLoad = (win: d.DevClientWindow, config: d.DevClientConfig) => {
  let pathname = win.location.pathname;
  pathname = '/' + pathname.substring(config.basePath.length);
  return pathname === c.DEV_SERVER_INIT_URL;
};
