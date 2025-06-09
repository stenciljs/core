import * as d from '../../declarations';
import { isInteractive } from './helpers';
import { checkTelemetry } from './telemetry';

/**
 * Used to determine if tracking should occur.
 * @param config The config passed into the Stencil command
 * @param sys The system where the command is invoked
 * @param ci whether or not the process is running in a Continuous Integration (CI) environment
 * @returns true if telemetry should be sent, false otherwise
 */
export async function shouldTrack(config: d.ValidatedConfig, sys: d.CompilerSystem, ci?: boolean) {
  return !ci && isInteractive(sys, config.flags) && (await checkTelemetry(sys));
}
