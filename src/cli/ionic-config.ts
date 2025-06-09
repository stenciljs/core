import type * as d from '../declarations';
import { readJson, UUID_REGEX, uuidv4 } from './telemetry/helpers';

export const isTest = () => process.env.JEST_WORKER_ID !== undefined;

export const defaultConfig = (sys: d.CompilerSystem) =>
  sys.resolvePath(`${sys.homeDir()}/.ionic/${isTest() ? 'tmp-config.json' : 'config.json'}`);

export const defaultConfigDirectory = (sys: d.CompilerSystem) => sys.resolvePath(`${sys.homeDir()}/.ionic`);

/**
 * Reads an Ionic configuration file from disk, parses it, and performs any necessary corrections to it if certain
 * values are deemed to be malformed
 * @param sys The system where the command is invoked
 * @returns the config read from disk that has been potentially been updated
 */
export async function readConfig(sys: d.CompilerSystem): Promise<d.TelemetryConfig> {
  let config: d.TelemetryConfig = await readJson(sys, defaultConfig(sys));

  if (!config) {
    config = {
      'tokens.telemetry': uuidv4(),
      'telemetry.stencil': true,
    };

    await writeConfig(sys, config);
  } else if (!config['tokens.telemetry'] || !UUID_REGEX.test(config['tokens.telemetry'])) {
    const newUuid = uuidv4();
    await writeConfig(sys, { ...config, 'tokens.telemetry': newUuid });
    config['tokens.telemetry'] = newUuid;
  }

  return config;
}

/**
 * Writes an Ionic configuration file to disk.
 * @param sys The system where the command is invoked
 * @param config The config passed into the Stencil command
 * @returns boolean If the command was successful
 */
export async function writeConfig(sys: d.CompilerSystem, config: d.TelemetryConfig): Promise<boolean> {
  let result = false;
  try {
    await sys.createDir(defaultConfigDirectory(sys), { recursive: true });
    await sys.writeFile(defaultConfig(sys), JSON.stringify(config, null, 2));
    result = true;
  } catch (error) {
    console.error(`Stencil Telemetry: couldn't write configuration file to ${defaultConfig(sys)} - ${error}.`);
  }

  return result;
}

/**
 * Update a subset of the Ionic config.
 * @param sys The system where the command is invoked
 * @param newOptions The new options to save
 * @returns boolean If the command was successful
 */
export async function updateConfig(sys: d.CompilerSystem, newOptions: d.TelemetryConfig): Promise<boolean> {
  const config = await readConfig(sys);
  return await writeConfig(sys, Object.assign(config, newOptions));
}
