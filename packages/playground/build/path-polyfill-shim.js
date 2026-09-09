import posixImpl from 'path-browserify';

posixImpl.win32 = posixImpl;
posixImpl.posix = posixImpl;

export default posixImpl;
export const {
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  normalize,
  relative,
  resolve,
  sep,
  delimiter,
  parse,
  format,
  win32,
  posix,
} = posixImpl;
