import { tryFn, readJson, hasVerbose, uuidv4, getMajorVersion, hasDebug } from '@utils';
import { shouldTrack } from './shouldTrack';
import * as d from '../../declarations';
import { CoreCompiler } from '../load-compiler';
import { readConfig, updateConfig, writeConfig } from '../ionic-config';

/**
 * Used to within taskBuild to provide the component_count property.
 * @param result The results of a compiler build.
 */
export async function telemetryBuildFinishedAction(
  config: d.Config,
  logger: d.Logger,
  coreCompiler: CoreCompiler,
  sys: d.CompilerSystem,
  result: d.CompilerBuildResults
) {
  const tracking = await shouldTrack(config, sys, config.flags.ci);

  if (!tracking) {
    return;
  }

  const component_count = Object.keys(result.componentGraph).length;

  const data = await prepareData(coreCompiler, config, sys, result.duration, component_count);

  await sendMetric(sys, config, 'stencil_cli_command', data);
  logger.debug(`${logger.blue('Telemetry')}: ${logger.gray(JSON.stringify(data))}`);
}

/**
 * A function to wrap a compiler task function around. Will send telemetry if, and only if, the machine allows.
 * @param action A Promise-based function to call in order to get the duration of any given command.
 * @returns void
 */
export async function telemetryAction(
  sys: d.CompilerSystem,
  config: d.Config,
  logger: d.Logger,
  coreCompiler: CoreCompiler,
  action?: d.TelemetryCallback
) {
  const tracking = await shouldTrack(config, sys, !!config?.flags?.ci);

  let duration = undefined;
  let error: any;

  if (action) {
    const start = new Date();

    try {
      await action();
    } catch (e) {
      error = e;
    }

    const end = new Date();
    duration = end.getTime() - start.getTime();
  }

  // We'll get componentCount details inside the taskBuild, so let's not send two messages.
  if (!tracking || (config.flags.task == 'build' && !config.flags.args.includes('--watch'))) {
    return;
  }

  const data = await prepareData(coreCompiler, config, sys, duration);

  await sendMetric(sys, config, 'stencil_cli_command', data);
  logger.debug(`${logger.blue('Telemetry')}: ${logger.gray(JSON.stringify(data))}`);

  if (error) {
    throw error;
  }
}

export function hasAppTarget(config: d.Config): boolean {
  return config.outputTargets.some(
    (target) => target.type === 'www' && (!!target.serviceWorker || (!!target.baseUrl && target.baseUrl !== '/'))
  );
}

export function isUsingYarn(sys: d.CompilerSystem) {
  return sys.getEnvironmentVar('npm_execpath')?.includes('yarn') || false;
}

export async function getActiveTargets(config: d.Config): Promise<string[]> {
  const result = config.outputTargets.map((t) => t.type);
  return Array.from(new Set(result));
}

export const prepareData = async (
  coreCompiler: CoreCompiler,
  config: d.Config,
  sys: d.CompilerSystem,
  duration_ms: number,
  component_count: number = undefined
): Promise<d.TrackableData> => {
  const { typescript, rollup } = coreCompiler.versions || { typescript: 'unknown', rollup: 'unknown' };
  const { packages, packages_no_versions } = await getInstalledPackages(sys, config);
  const targets = await getActiveTargets(config);
  const yarn = isUsingYarn(sys);
  const stencil = coreCompiler.version || 'unknown';
  const system = `${sys.name} ${sys.version}`;
  const os_name = sys.details.platform;
  const os_version = sys.details.release;
  const cpu_model = sys.details.cpuModel;
  const build = coreCompiler.buildId || 'unknown';
  const has_app_pwa_config = hasAppTarget(config);

  return {
    yarn,
    duration_ms,
    component_count,
    targets,
    packages,
    packages_no_versions,
    arguments: config.flags.args,
    task: config.flags.task,
    stencil,
    system,
    system_major: getMajorVersion(system),
    os_name,
    os_version,
    cpu_model,
    build,
    typescript,
    rollup,
    has_app_pwa_config,
  };
};

/**
 * Reads package-lock.json and package.json files in order to cross references the dependencies and devDependencies properties. Pull the current installed version of each package under the @stencil, @ionic, and @capacitor scopes.
 * @returns string[]
 */
async function getInstalledPackages(
  sys: d.CompilerSystem,
  config: d.Config
): Promise<{ packages: string[]; packages_no_versions: string[] }> {
  let packages: string[] = [],
    packages_no_versions: string[] = [],
    packageLockJson: any;

  try {
    // Read package.json and package-lock.json
    const appRootDir = sys.getCurrentDirectory();

    const packageJson: d.PackageJsonData = await tryFn(readJson, sys, sys.resolvePath(appRootDir + '/package.json'));

    // They don't have a package.json for some reason? Eject button.
    if (!packageJson) {
      return { packages, packages_no_versions };
    }

    const rawPackages: [string, string][] = Object.entries({
      ...packageJson.devDependencies,
      ...packageJson.dependencies,
    });

    // Collect packages only in the stencil, ionic, or capacitor org's:
    // https://www.npmjs.com/org/stencil
    const ionicPackages = rawPackages.filter(
      ([k]) => k.startsWith('@stencil/') || k.startsWith('@ionic/') || k.startsWith('@capacitor/')
    );

    try {
      if (!isUsingYarn(sys)) {
        packageLockJson = await tryFn(readJson, sys, sys.resolvePath(appRootDir + '/package-lock.json'));

        packages = ionicPackages.map(([k, v]) => {
          const version =
            packageLockJson?.dependencies[k]?.version ?? packageLockJson?.devDependencies[k]?.version ?? v;
          return `${k}@${version}`;
        });
      } else if (isUsingYarn(sys)) {
        const yarnLock = sys.readFileSync(appRootDir + '/yarn.lock');
        packageLockJson = sys.parseYarnLockFile(yarnLock);

        packages = ionicPackages.map(([k, v]) => {
          const identifiedVersion = `${k}@${v}`;
          const version = packageLockJson.object[identifiedVersion]?.version;
          return `${k}@${version}`;
        });
      } else {
        packages = ionicPackages.map(([k, v]) => `${k}@${v.replace('^', '')}`);
      }
    } catch (e) {
      packages = ionicPackages.map(([k, v]) => `${k}@${v.replace('^', '')}`);
    }

    packages_no_versions = ionicPackages.map(([k]) => `${k}`);

    return { packages, packages_no_versions };
  } catch (err) {
    hasDebug(config) && console.error(err);
    return { packages, packages_no_versions };
  }
}

/**
 * If telemetry is enabled, send a metric via IPC to a forked process for uploading.
 */
export async function sendMetric(
  sys: d.CompilerSystem,
  config: d.Config,
  name: string,
  value: d.TrackableData
): Promise<void> {
  const session_id = await getTelemetryToken(sys);

  const message: d.Metric = {
    name,
    timestamp: new Date().toISOString(),
    source: 'stencil_cli',
    value,
    session_id,
  };

  await sendTelemetry(sys, config, { type: 'telemetry', message });
}

/**
 * Used to read the config file's tokens.telemetry property.
 * @returns string
 */
async function getTelemetryToken(sys: d.CompilerSystem) {
  const config = await readConfig(sys);
  if (config['tokens.telemetry'] === undefined) {
    config['tokens.telemetry'] = uuidv4();
    await writeConfig(sys, config);
  }
  return config['tokens.telemetry'];
}

/**
 * Issues a request to the telemetry server.
 * @param data Data to be tracked
 */
async function sendTelemetry(sys: d.CompilerSystem, config: d.Config, data: any) {
  try {
    const now = new Date().toISOString();

    const body = {
      metrics: [data.message],
      sent_at: now,
    };

    // This request is only made if telemetry is on.
    const response = await sys.fetch('https://api.ionicjs.com/events/metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    hasVerbose(config) &&
      console.debug('\nSent %O metric to events service (status: %O)', data.message.name, response.status, '\n');

    if (response.status !== 204) {
      hasVerbose(config) &&
        console.debug('\nBad response from events service. Request body: %O', response.body.toString(), '\n');
    }
  } catch (e) {
    hasVerbose(config) && console.debug('Telemetry request failed:', e);
  }
}

/**
 * Checks if telemetry is enabled on this machine
 * @returns true if telemetry is enabled, false otherwise
 */
export async function checkTelemetry(sys: d.CompilerSystem): Promise<boolean> {
  const config = await readConfig(sys);
  if (config['telemetry.stencil'] === undefined) {
    config['telemetry.stencil'] = true;
    await writeConfig(sys, config);
  }
  return config['telemetry.stencil'];
}

/**
 * Writes to the config file, enabling telemetry for this machine.
 * @returns true if writing the file was successful, false otherwise
 */
export async function enableTelemetry(sys: d.CompilerSystem): Promise<boolean> {
  return await updateConfig(sys, { 'telemetry.stencil': true });
}

/**
 * Writes to the config file, disabling telemetry for this machine.
 * @returns true if writing the file was successful, false otherwise
 */
export async function disableTelemetry(sys: d.CompilerSystem): Promise<boolean> {
  return await updateConfig(sys, { 'telemetry.stencil': false });
}
