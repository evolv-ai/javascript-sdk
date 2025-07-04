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
 * @property {*} [store]
 * @property {*} [context]
 * @property {*} [auth]
 * @property {boolean} [bufferEvents]
 * @property {string} [clientName]
 * @property {'direct' | 'proxied'} [clientType = 'direct']
 * @property {boolean} [pollForTimeUpdates]
 * @property {string} [profileId]
 */

/**
 * @param {Partial<EvolvClientOptions>} options
 * @returns EvolvClientOptions
 */
export function buildOptions(options) {
  const defaults = {
    clientType: 'direct'
  };

  const opts = assign({}, defaults, options);

  if (!opts.environment) {
    throw new Error('"environment" must be specified');
  }

  if (!('autoConfirm' in opts)) {
    opts.autoConfirm = true;
  }

  opts.version = opts.version || 1;
  opts.endpoint = ((opts.endpoint && opts.endpoint.replace(/\/$/, '')) || 'https://participants.evolv.ai') + '/v' + opts.version;

  opts.hooks = assign({}, opts.hooks);

  return opts;
}
