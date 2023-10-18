import { outdent } from 'outdent';
import alias from '@rollup/plugin-alias';
import commonJs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';

import manifest from './package.json';


const banner = () => {
  const year = new Date().getFullYear();
  const version = (process?.env?.SEM_VER ?? manifest.version) // eslint-disable-line no-undef
    .replace(/\*\//gm, ''); // Prevents injection

  const comment = outdent`
      * Evolv Client for JavaScript v${version} <https://github.com/evolv-ai/javascript-sdk>
       *
       * Copyright 2020-${year} Evolv Technology Solutions
       *
       * Licensed under the Apache License, Version 2.0 (the "License");
       * you may not use this file except in compliance with the License.
       * You may obtain a copy of the License at
       *
       *   http://www.apache.org/licenses/LICENSE-2.0
       *
       * Unless required by applicable law or agreed to in writing, software
       * distributed under the License is distributed on an "AS IS" BASIS,
       * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
       * See the License for the specific language governing permissions and
       * limitations under the License.
    `;

  return `/*!\n ${comment}\n */\n`;
};

function rollupConfig(type, isNodeRuntime = false) {

  const ext = type === 'esm'
    ? 'mjs'
    : 'cjs'

  const dir = isNodeRuntime
    ? 'node'
    : 'browser'

  return {
    input: './src/index.js',
    output: {
      file: `./dist/${dir}/index.${ext}`,
      format: type,
      exports: 'named',
      sourcemap: true,
      banner
    },
    external: [
      ...Object.keys(manifest.peerDependencies || {}),
      'http',
      'https'
    ],
    plugins: [
      alias({
        entries: [
          {
            find: './helpers/requests/index.js',
            replacement: isNodeRuntime
              ? './helpers/requests/fetch-request'
              : './helpers/requests/xhr-request'
          }
        ]
      }),
      copy({
        targets: [
          { src: 'src/types.d.ts', dest: 'dist' }
        ]
      }),
      nodeResolve(),
      commonJs()
    ]
  };
}

export default [
  rollupConfig('esm', true),
  rollupConfig('esm', false),
  rollupConfig('cjs', false)
];
