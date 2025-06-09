import type * as d from '@stencil/core/internal';

export function toMatchScreenshot(compare: d.ScreenshotDiff, opts: d.MatchScreenshotOptions = {}) {
  if (!compare) {
    throw new Error(`expect toMatchScreenshot value is null`);
  }

  if (typeof (compare as any).then === 'function') {
    throw new Error(
      `expect(compare).toMatchScreenshot() must be a resolved value, not a promise, before it can be tested`,
    );
  }

  if (typeof compare.mismatchedPixels !== 'number') {
    throw new Error(
      `expect toMatchScreenshot() value is not a valid screenshot compare object - 'mismatchedPixels' has type '${typeof compare.mismatchedPixels}', but should be a number`,
    );
  }

  if (typeof compare.deviceScaleFactor !== 'number') {
    throw new Error(
      `expect toMatchScreenshot() value is not a valid screenshot compare object - 'deviceScaleFactor' has type '${typeof compare.deviceScaleFactor}', but should be a number`,
    );
  }

  const device = compare.device || compare.userAgent;

  if (typeof opts.allowableMismatchedRatio === 'number') {
    if (opts.allowableMismatchedRatio < 0 || opts.allowableMismatchedRatio > 1) {
      throw new Error(`expect toMatchScreenshot() allowableMismatchedRatio must be a value ranging from 0 to 1`);
    }

    const mismatchedRatio =
      compare.mismatchedPixels /
      (compare.width * compare.deviceScaleFactor * (compare.height * compare.deviceScaleFactor));
    return {
      message: () =>
        `${device}: screenshot has a mismatch ratio of "${mismatchedRatio}" for "${compare.desc}", but expected ratio to be less than "${opts.allowableMismatchedRatio}"`,
      pass: mismatchedRatio <= opts.allowableMismatchedRatio,
    };
  }

  if (typeof opts.allowableMismatchedPixels === 'number') {
    if (opts.allowableMismatchedPixels < 0) {
      throw new Error(
        `expect toMatchScreenshot() allowableMismatchedPixels value must be a value that is 0 or greater`,
      );
    }
    return {
      message: () =>
        `${device}: screenshot has "${compare.mismatchedPixels}" mismatched pixels for "${compare.desc}", but expected less than "${opts.allowableMismatchedPixels}" mismatched pixels`,
      pass: compare.mismatchedPixels <= opts.allowableMismatchedPixels,
    };
  }

  if (typeof compare.allowableMismatchedRatio === 'number') {
    const mismatchedRatio =
      compare.mismatchedPixels /
      (compare.width * compare.deviceScaleFactor * (compare.height * compare.deviceScaleFactor));
    return {
      message: () =>
        `${device}: screenshot has a mismatch ratio of "${mismatchedRatio}" for "${compare.desc}", but expected ratio to be less than "${compare.allowableMismatchedRatio}"`,
      pass: mismatchedRatio <= compare.allowableMismatchedRatio,
    };
  }

  if (typeof compare.allowableMismatchedPixels === 'number') {
    return {
      message: () =>
        `${device}: screenshot has "${compare.mismatchedPixels}" mismatched pixels for "${compare.desc}", but expected less than "${compare.allowableMismatchedPixels}" mismatched pixels`,
      pass: compare.mismatchedPixels <= compare.allowableMismatchedPixels,
    };
  }

  throw new Error(`expect toMatchScreenshot() missing allowableMismatchedPixels in testing config`);
}
