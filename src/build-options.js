import { assign } from './ponyfills/objects.js';

/**
 * @typedef EvolvClientOptions
 * @property {string} environment
 * @property {number} version
 * @property {string} endpoint
 * @property {boolean} autoConfirm
 * @property {boolean} analytics
 * @property {*} [store]
 * @property {*} [context]
 * @property {*} [auth]
 * @property {boolean} [bufferEvents]
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

  return opts;
}
