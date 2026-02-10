import * as d from '@stencil/core';
import type { ConfigFlags } from '../config-flags';
import { isInteractive } from './helpers';
import { checkTelemetry } from './telemetry';

/**
 * Used to determine if tracking should occur.
 * @param sys The system where the command is invoked
 * @param flags The CLI flags (owned by CLI, not part of core config)
 * @param ci whether or not the process is running in a Continuous Integration (CI) environment
 * @returns true if telemetry should be sent, false otherwise
 */
export async function shouldTrack(sys: d.CompilerSystem, flags: ConfigFlags, ci?: boolean) {
  return !ci && isInteractive(sys, flags) && (await checkTelemetry(sys));
}
