import { assign } from './ponyfills/objects.js';

/**
 * @typedef RequestHooks
 * @property {(options: RetrieveOptions) => RetrieveOptions} [beforeOptions]
 */

/**
 * @typedef EvolvClientOptions
 * @property {string} environment
 * @property {number} [version]
 * @property {string} [endpoint]
 * @property {boolean} [autoConfirm]
 * @property {RequestHooks} [hooks]
 * @property {boolean} [analytics]
 * @property {*} [store]
 * @property {*} [context]
 * @property {*} [auth]
 * @property {boolean} [bufferEvents]
 * @property {string} [clientName]
 */

/**
 * @param {Partial<EvolvClientOptions>} options
 * @returns EvolvClientOptions
 */
export function buildOptions(options) {
  const opts = assign({}, options);

  if (!opts.environment) {
    throw new Error('"environment" must be specified');
  }

  if (!('autoConfirm' in opts)) {
    opts.autoConfirm = true;
  }

  opts.version = opts.version || 1;
  opts.endpoint = (opts.endpoint || 'https://participants.evolv.ai/') + 'v' + opts.version;
  opts.analytics = 'analytics' in opts ? opts.analytics : opts.version > 1;

  opts.hooks = assign({}, opts.hooks);

  return opts;
}
