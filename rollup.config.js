import del from 'rollup-plugin-delete';
import external from 'rollup-plugin-peer-deps-external';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';

import pkg from './package.json';

const isDev = process.env.NODE_ENV !== 'production';

export default {
  input: 'src/index.js',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      exports: 'named',
      sourcemap: isDev
    },
    {
      file: pkg.module,
      format: 'es',
      exports: 'named',
      sourcemap: isDev
    }
  ],
  plugins: [
    del({ targets: 'dist/*' }),
    external(),
    resolve(),
    commonjs({ include: ['node_modules/**'] }),
    babel({ babelrc: false, presets: [['@babel/env', { modules: false }]], exclude: 'node_modules/**' }),
    !isDev && terser()
  ]
};
