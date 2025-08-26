/**
 * Shared event names object for cross-component communication
 */
export const EVENT_NAMES = {
  A_TO_B: 'aToB',
  A_TO_C: 'aToC',
  A_TO_D: 'aToD',
  A_TO_E: 'aToE',
  A_TO_BC: 'aToBc',
  A_TO_BD: 'aToBd',
  A_TO_BE: 'aToBe',
  B_TO_A: 'bToA',
  B_TO_C: 'bToC',
  B_TO_D: 'bToD',
  B_TO_E: 'bToE',
  B_TO_AC: 'bToAc',
  B_TO_AD: 'bToAd',
  B_TO_AE: 'bToAe',
  C_TO_A: 'cToA',
  C_TO_B: 'cToB',
  C_TO_D: 'cToD',
  C_TO_E: 'cToE',
  C_TO_AB: 'cToAb',
  C_TO_AD: 'cToAd',
  C_TO_AE: 'cToAe',
  D_TO_A: 'dToA',
  D_TO_B: 'dToB',
  D_TO_C: 'dToC',
  D_TO_E: 'dToE',
  D_TO_AB: 'dToAb',
  D_TO_AC: 'dToAc',
  D_TO_AE: 'dToAe',
  E_TO_A: 'eToA',
  E_TO_B: 'eToB',
  E_TO_C: 'eToC',
  E_TO_D: 'eToD',
  E_TO_AB: 'eToAb',
  E_TO_AC: 'eToAc',
  E_TO_AD: 'eToAd',
} as const;

/**
 * Single event constant for testing import patterns
 */
export const SHARED_EVENT = 'sharedCustomEvent';
