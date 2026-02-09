import { hasError, hasWarning, result } from '../../utils';

import type * as d from '@stencil/core';
import { validateConfig } from '../config/validate-config';

/**
 * A new BuildCtx object is created for every build
 * and rebuild.
 */
export class BuildContext implements d.BuildCtx {
  buildId = -1;
  buildMessages: string[] = [];
  buildResults: d.CompilerBuildResults = null;
  bundleBuildCount = 0;
  collections: d.CollectionCompilerMeta[] = [];
  completedTasks: d.BuildTask[] = [];
  compilerCtx: d.CompilerCtx;
  components: d.ComponentCompilerMeta[] = [];
  componentGraph = new Map<string, string[]>();
  config: d.ValidatedConfig;
  data: any = {};
  buildStats?: result.Result<d.CompilerBuildStats, { diagnostics: d.Diagnostic[] }> = undefined;
  esmBrowserComponentBundle: d.BundleModule[];
  esmComponentBundle: d.BundleModule[];
  es5ComponentBundle: d.BundleModule[];
  systemComponentBundle: d.BundleModule[];
  commonJsComponentBundle: d.BundleModule[];
  diagnostics: d.Diagnostic[] = [];
  dirsAdded: string[] = [];
  dirsDeleted: string[] = [];
  entryModules: d.EntryModule[] = [];
  filesAdded: string[] = [];
  filesChanged: string[] = [];
  filesDeleted: string[] = [];
  filesUpdated: string[] = [];
  filesWritten: string[] = [];
  globalStyle: string = undefined;
  hasConfigChanges = false;
  hasFinished = false;
  hasHtmlChanges = false;
  hasPrintedResults = false;
  hasServiceWorkerChanges = false;
  hasScriptChanges = true;
  hasStyleChanges = true;
  hydrateAppFilePath: string = null;
  indexBuildCount = 0;
  indexDoc: Document = undefined;
  isRebuild = false;
  moduleFiles: d.Module[] = [];
  outputs: d.BuildOutput[] = [];
  packageJson: d.PackageJsonData = {};
  packageJsonFilePath: string = null;
  pendingCopyTasks: Promise<d.CopyResults>[] = [];
  requiresFullBuild = true;
  scriptsAdded: string[] = [];
  scriptsDeleted: string[] = [];
  startTime = Date.now();
  styleBuildCount = 0;
  stylesPromise: Promise<string> = null;
  stylesUpdated: d.BuildStyleUpdate[] = [];
  timeSpan: d.LoggerTimeSpan = null;
  timestamp: string;
  transpileBuildCount = 0;
  validateTypesPromise: Promise<d.ValidateTypesResults>;

  constructor(config: d.Config, compilerCtx: d.CompilerCtx) {
    this.config = validateConfig(config, {}).config;
    this.compilerCtx = compilerCtx;
    this.buildId = ++this.compilerCtx.activeBuildId;

    this.debug = config.logger.debug.bind(config.logger);
  }

  start() {
    // get the build id from the incremented activeBuildId
    // print out a good message
    const msg = `${this.isRebuild ? 'rebuild' : 'build'}, ${this.config.fsNamespace}, ${
      this.config.devMode ? 'dev' : 'prod'
    } mode, started`;

    const buildLog: d.BuildLog = {
      buildId: this.buildId,
      messages: [],
      progress: 0,
    };
    this.compilerCtx.events.emit('buildLog', buildLog);

    // create a timespan for this build
    this.timeSpan = this.createTimeSpan(msg);

    // create a build timestamp for this build
    this.timestamp = getBuildTimestamp();

    // debug log our new build
    this.debug(`start build, ${this.timestamp}`);

    const buildStart: d.CompilerBuildStart = {
      buildId: this.buildId,
      timestamp: this.timestamp,
    };
    this.compilerCtx.events.emit('buildStart', buildStart);
  }

  createTimeSpan(msg: string, debug?: boolean) {
    if (!this.hasFinished || debug) {
      if (debug) {
        if (this.config.watch) {
          msg = `${this.config.logger.cyan('[' + this.buildId + ']')} ${msg}`;
        }
      }
      const timeSpan = this.config.logger.createTimeSpan(msg, debug, this.buildMessages);

      if (!debug && this.compilerCtx.events) {
        const buildLog: d.BuildLog = {
          buildId: this.buildId,
          messages: this.buildMessages,
          progress: getProgress(this.completedTasks),
        };
        this.compilerCtx.events.emit('buildLog', buildLog);
      }

      return {
        duration: () => {
          return timeSpan.duration();
        },
        finish: (finishedMsg: string, color?: string, bold?: boolean, newLineSuffix?: boolean) => {
          if (!this.hasFinished || debug) {
            if (debug) {
              if (this.config.watch) {
                finishedMsg = `${this.config.logger.cyan('[' + this.buildId + ']')} ${finishedMsg}`;
              }
            }

            timeSpan.finish(finishedMsg, color, bold, newLineSuffix);

            if (!debug) {
              const buildLog: d.BuildLog = {
                buildId: this.buildId,
                messages: this.buildMessages.slice(),
                progress: getProgress(this.completedTasks),
              };
              this.compilerCtx.events.emit('buildLog', buildLog);
            }
          }
          return timeSpan.duration();
        },
      };
    }

    return {
      duration() {
        return 0;
      },
      finish() {
        return 0;
      },
    };
  }

  debug(msg: string) {
    this.config.logger.debug(msg);
  }

  get hasError() {
    return hasError(this.diagnostics);
  }

  get hasWarning() {
    return hasWarning(this.diagnostics);
  }

  progress(t: d.BuildTask) {
    this.completedTasks.push(t);
  }

  async validateTypesBuild() {
    if (this.hasError) {
      // no need to wait on this one since
      // we already aborted this build
      return;
    }

    if (!this.validateTypesPromise) {
      // there is no pending validate types promise
      // so it probably already finished
      // so no need to wait on anything
      return;
    }

    if (!this.config.watch) {
      // this is not a watch build, so we need to make
      // sure that the type validation has finished
      this.debug(`build, non-watch, waiting on validateTypes`);
      await this.validateTypesPromise;
      this.debug(`build, non-watch, finished waiting on validateTypes`);
    }
  }
}

/**
 * Generate a timestamp of the format `YYYY-MM-DDThh:mm:ss`, using the number of seconds that have elapsed since
 * January 01, 1970, and the time this function was called
 * @returns the generated timestamp
 */
export const getBuildTimestamp = () => {
  const d = new Date();

  // YYYY-MM-DDThh:mm:ss
  let timestamp = d.getUTCFullYear() + '-';
  timestamp += ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-';
  timestamp += ('0' + d.getUTCDate()).slice(-2) + 'T';
  timestamp += ('0' + d.getUTCHours()).slice(-2) + ':';
  timestamp += ('0' + d.getUTCMinutes()).slice(-2) + ':';
  timestamp += ('0' + d.getUTCSeconds()).slice(-2);

  return timestamp;
};

const getProgress = (completedTasks: d.BuildTask[]) => {
  let progressIndex = 0;
  const taskKeys = Object.keys(ProgressTask);

  taskKeys.forEach((taskKey, index) => {
    if (completedTasks.includes((ProgressTask as any)[taskKey])) {
      progressIndex = index;
    }
  });

  return (progressIndex + 1) / taskKeys.length;
};

export const ProgressTask = {
  emptyOutputTargets: {},
  transpileApp: {},
  generateStyles: {},
  generateOutputTargets: {},
  validateTypesBuild: {},
  writeBuildFiles: {},
};
