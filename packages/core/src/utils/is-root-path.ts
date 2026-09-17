/**
 * Checks if the path is the Operating System (OS) root path, such as "/" or "C:\". This function does not take the OS
 * the code is running on into account when performing this evaluation.
 * @param p the path to check
 * @returns `true` if the path is an OS root path, `false` otherwise
 */
export const isRootPath = (p: string) => p === '/' || windowsPathRegex.test(p);

// https://github.com/nodejs/node/blob/5883a59b21a97e8b7339f435c977155a2c29ba8d/lib/path.js#L43
const windowsPathRegex = /^(?:[a-zA-Z]:|[\\/]{2}[^\\/]+[\\/]+[^\\/]+)?[\\/]$/;
