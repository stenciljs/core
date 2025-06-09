import type * as d from '../../declarations';
import {
  appError,
  clearAppErrorModal,
  emitBuildStatus,
  hmrWindow,
  logBuild,
  logDiagnostic,
  logReload,
  logWarn,
  onBuildResults,
} from '../client';
import { OPEN_IN_EDITOR_URL } from '../dev-server-constants';

export const initAppUpdate = (win: d.DevClientWindow, config: d.DevClientConfig) => {
  onBuildResults(win, (buildResults) => {
    appUpdate(win, config, buildResults);
  });
};

const appUpdate = (win: d.DevClientWindow, config: d.DevClientConfig, buildResults: d.CompilerBuildResults) => {
  try {
    if (buildResults.buildId === win['s-build-id']) {
      return;
    }
    win['s-build-id'] = buildResults.buildId;

    // remove any app errors that may already be showing
    clearAppErrorModal({ window: win });

    if (buildResults.hasError) {
      // looks like we've got an error
      // let's show the error all pretty like
      const editorId = Array.isArray(config.editors) && config.editors.length > 0 ? config.editors[0].id : null;
      const errorResults = appError({
        window: win,
        buildResults: buildResults,
        openInEditor: editorId
          ? (data) => {
              const qs: d.OpenInEditorData = {
                file: data.file,
                line: data.line,
                column: data.column,
                editor: editorId,
              };

              const url = `${OPEN_IN_EDITOR_URL}?${Object.keys(qs)
                .map((k) => `${k}=${(qs as any)[k]}`)
                .join('&')}`;
              win.fetch(url);
            }
          : null,
      });

      errorResults.diagnostics.forEach(logDiagnostic);
      emitBuildStatus(win, errorResults.status);
      return;
    }

    if (win['s-initial-load']) {
      // this page is the initial dev server loading page
      // and the build has finished without errors
      // let's make sure the url is at the root
      // and we've unregistered any existing service workers
      // then let's refresh the page from the root of the server
      appReset(win, config, () => {
        logReload(`Initial load`);
        win.location.reload();
      });
      return;
    }

    if (buildResults.hmr) {
      appHmr(win, buildResults.hmr);
    }
  } catch (e) {
    console.error(e);
  }
};

const appHmr = (win: Window, hmr: d.HotModuleReplacement) => {
  let shouldWindowReload = false;

  if (hmr.reloadStrategy === 'pageReload') {
    shouldWindowReload = true;
  }

  if (hmr.indexHtmlUpdated) {
    logReload(`Updated index.html`);
    shouldWindowReload = true;
  }

  if (hmr.serviceWorkerUpdated) {
    logReload(`Updated Service Worker: sw.js`);
    shouldWindowReload = true;
  }

  if (hmr.scriptsAdded && hmr.scriptsAdded.length > 0) {
    logReload(`Added scripts: ${hmr.scriptsAdded.join(', ')}`);
    shouldWindowReload = true;
  }

  if (hmr.scriptsDeleted && hmr.scriptsDeleted.length > 0) {
    logReload(`Deleted scripts: ${hmr.scriptsDeleted.join(', ')}`);
    shouldWindowReload = true;
  }

  if (hmr.excludeHmr && hmr.excludeHmr.length > 0) {
    logReload(`Excluded From Hmr: ${hmr.excludeHmr.join(', ')}`);
    shouldWindowReload = true;
  }

  if (shouldWindowReload) {
    win.location.reload();
    return;
  }

  const results = hmrWindow({ window: win, hmr: hmr });

  if (results.updatedComponents.length > 0) {
    logBuild(
      `Updated component${results.updatedComponents.length > 1 ? 's' : ''}: ${results.updatedComponents.join(', ')}`,
    );
  }

  if (results.updatedInlineStyles.length > 0) {
    logBuild(`Updated styles: ${results.updatedInlineStyles.join(', ')}`);
  }

  if (results.updatedExternalStyles.length > 0) {
    logBuild(`Updated stylesheets: ${results.updatedExternalStyles.join(', ')}`);
  }

  if (results.updatedImages.length > 0) {
    logBuild(`Updated images: ${results.updatedImages.join(', ')}`);
  }
};

export const appReset = (win: d.DevClientWindow, config: d.DevClientConfig, cb: () => void) => {
  // we're probably at some ugly url
  // let's update the url to be the expect root url: /
  // avoiding Promise to keep things simple for our ie11 buddy
  win.history.replaceState({}, 'App', config.basePath);

  if (!win.navigator.serviceWorker || !win.navigator.serviceWorker.getRegistration) {
    cb();
  } else {
    // it's possible a service worker is already registered
    // for this localhost url from some other app's development
    // let's ensure we entirely remove the service worker for this domain
    win.navigator.serviceWorker
      .getRegistration()
      .then((swRegistration) => {
        if (swRegistration) {
          swRegistration.unregister().then((hasUnregistered) => {
            if (hasUnregistered) {
              logBuild(`unregistered service worker`);
            }
            cb();
          });
        } else {
          cb();
        }
      })
      .catch((err) => {
        logWarn('Service Worker', err);
        cb();
      });
  }
};
