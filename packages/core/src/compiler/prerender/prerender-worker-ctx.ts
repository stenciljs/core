import type * as d from '../../declarations';

export interface PrerenderContext {
  buildId: string;
  componentGraph: Map<string, string[]>;
  prerenderConfig: d.PrerenderConfig;
  ensuredDirs: Set<string>;
  templateHtml: string;
  hashedFile: Set<string>;
}

const prerenderCtx: PrerenderContext = {
  buildId: null,
  componentGraph: null,
  prerenderConfig: null,
  ensuredDirs: null,
  templateHtml: null,
  hashedFile: null,
};

export const getPrerenderCtx = (prerenderRequest: d.PrerenderUrlRequest) => {
  if (prerenderRequest.buildId !== prerenderCtx.buildId) {
    prerenderCtx.buildId = prerenderRequest.buildId;
    prerenderCtx.componentGraph = null;
    prerenderCtx.prerenderConfig = null;
    prerenderCtx.ensuredDirs = new Set();
    prerenderCtx.templateHtml = null;
    prerenderCtx.hashedFile = new Set();
  }
  return prerenderCtx;
};
