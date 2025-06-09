export const IS_WINDOWS_ENV = process.platform === 'win32';

export const IS_CASE_SENSITIVE_FILE_NAMES = !IS_WINDOWS_ENV;
