import fs from 'fs-extra';
import path from 'path';

const input = require.resolve('postcss');
const output = path.join(__dirname, '..', 'bundles', 'helpers', 'postcss.js');
const postcssPkg = fs.readJSONSync(path.join(input, '..', '..', 'package.json'));

export default {
  input,
  output: {
    format: 'esm',
    file: output,
    banner: `// postcss esm build from ${postcssPkg.version}`,
  },
  plugins: [
    {
      resolveId(importee, importer) {
        if (importee.startsWith('.')) {
          if (importer && importer.endsWith('.es6')) {
            const dir = path.dirname(importer);
            return path.join(dir, importee + '.es6');
          }
        }
      },
    },
  ],
};
