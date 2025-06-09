import fs from 'fs-extra';
import path from 'path';

import { BuildOptions } from './options';

export function writePkgJson(opts: BuildOptions, pkgDir: string, pkgData: PackageData) {
  pkgData.version = opts.version;
  pkgData.private = true;

  if (pkgData.main && !pkgData.main.startsWith('.')) {
    pkgData.main = `./${pkgData.main}`;
  }
  if (pkgData.module && !pkgData.module.startsWith('.')) {
    pkgData.module = `./${pkgData.module}`;
  }
  if (pkgData.types && !pkgData.types.startsWith('.')) {
    pkgData.types = `./${pkgData.types}`;
  }

  if (pkgData.module && pkgData.main) {
    pkgData.type = 'module';
    pkgData.exports = {
      import: pkgData.module,
      require: pkgData.main,
    };
  }

  // idk, i just like a nice pretty standardized order of package.json properties
  const formatedPkg: any = {};
  PROPS_ORDER.forEach((pkgProp) => {
    if (pkgProp in pkgData) {
      formatedPkg[pkgProp] = pkgData[pkgProp as keyof PackageData];
    }
  });

  fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify(formatedPkg, null, 2) + '\n');
}

const PROPS_ORDER = [
  'name',
  'version',
  'description',
  'bin',
  'main',
  'module',
  'browser',
  'types',
  'exports',
  'type',
  'files',
  'private',
  'sideEffects',
];

export interface PackageData {
  name: string;
  description: string;
  main: string;
  module?: string;
  browser?: string;
  exports?: any;
  type?: string;
  types?: string;
  version?: string;
  dependencies?: string[];
  private?: boolean;
  license?: string | any;
  licenses?: string | any;
  author?: string | any;
  contributors?: string | any;
  homepage?: string;
  repository?: any;
  files?: string[];
  bin?: { [key: string]: string };
  sideEffects?: false;
}
