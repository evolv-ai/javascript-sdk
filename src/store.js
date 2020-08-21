import MiniPromise from './ponyfills/minipromise.js';
import * as objects from './ponyfills/objects.js';
import * as strings from './ponyfills/strings.js';

import { evaluate } from './predicates.js';
import { waitFor, emit } from './waitforit.js';
import { CONTEXT_CHANGED } from './context.js';
import retrieve from './retrieve.js';

// Lock for updates, is updated by reevaluateContext()
let reevaluatingContext = false;

const CONFIG_SOURCE = 'config';
const GENOME_SOURCE = 'genome';

export const GENOME_REQUEST_SENT = 'genome.request.sent';
export const CONFIG_REQUEST_SENT = 'config.request.sent';
export const GENOME_REQUEST_RECEIVED = 'genome.request.received';
export const CONFIG_REQUEST_RECEIVED = 'config.request.received';
export const REQUEST_FAILED = 'request.failed';
export const GENOME_UPDATED = 'genome.updated';
export const CONFIG_UPDATED = 'config.updated';
export const EFFECTIVE_GENOME_UPDATED = 'effective.genome.updated';
export const STORE_DESTROYED = 'store.destroyed';

function moveKeys(keys, from, to) {
  keys.forEach(function(key) {
    from.delete(key);
    to.add(key);
  });
}

function wrapListener(listener) {
  return function() {
    try {
      listener.apply(undefined, arguments)
    } catch (ex) {
      console.log(ex);
    }
  };
}

function getValue(key, genome) {
  return objects.getValueForKey(key, genome);
}

function getConfigValue(key, genome, config) {
  return objects.getValueForKey(key, config);
}

function getValueActive(activeKeys, key) {
  return activeKeys.has(key);
}

function getActiveKeys(activeKeys, prefix) {
  const result = [];
  activeKeys.forEach(function(key) {
    if (!prefix || strings.startsWith(key, prefix)) {
      result.push(key);
    }
  });

  return result;
}

function activeEntryPoints(entryKeys) {
  const eids = [];

  entryKeys.experiments.forEach(function(expKeyStates, eid) {
    const entry = expKeyStates.get('entry');
    if (entry && entry.size > 0) {
      eids.push(eid);
    }
  });

  return eids;
}

// Exposed for testing
export function evaluatePredicates(version, context, config) {
  if (!config._experiments || !config._experiments.length) {
    return {};
  }

  function evaluateBranch(context, config, prefix, disabled, entry) {
    if (!config || typeof config !== 'object') {
      return;
    }

    if (config._predicate) {
      const result = evaluate(context, config._predicate);
      if (result.rejected) {
        disabled.push(prefix);
        return;
      }
    }

    if (config._is_entry_point) {
      entry.push(prefix);
    }

    Object.keys(config).forEach(function (key) {
      if (strings.startsWith(key, '_')) {
        return;
      }

      evaluateBranch(context, config[key], prefix ? prefix + '.' + key : key, disabled, entry);
    });
  }

  const evaluableContext = context.resolve();

  const result = new Map();
  config._experiments.forEach(function(exp) {
    const evaluableConfig = objects.assign({}, exp);
    delete evaluableConfig.id;
    const expResult = {
      disabled: [],
      entry: []
    };

    evaluateBranch(evaluableContext, evaluableConfig, '', expResult.disabled, expResult.entry);
    result.set(exp.id, expResult);
  });

  return result;
}

// Exposed for testing
export function getActiveAndEntryExperimentKeyStates(results, keyStatesLoaded) {
  const expKeyStates = {
    active: [],
    entry: []
  }

  keyStatesLoaded.forEach(function (key) {
    const active = !results.disabled.some(function (disabledKey) {
      return strings.startsWith(key, disabledKey);
    });

    if (active) {
      expKeyStates.active.push(key);
      const entry = results.entry.some(function (entryKey) {
        return strings.startsWith(key, entryKey);
      });

      if (entry) {
        expKeyStates.entry.push(key);
      }
    }
  });

  return expKeyStates;
}

export function setActiveAndEntryKeyStates(version, context, config, expsKeyStates, loadedGenomeKeys) {
  const results = evaluatePredicates(version, context, config);

  const newConfigKeyStates = new Map();
  results.forEach(function(expResults, eid) {
    const expKeyStates = (expsKeyStates.get(eid) || new Map());
    const newExpKeyStates = getActiveAndEntryExperimentKeyStates(expResults,  loadedGenomeKeys);

    const activeKeyStates = new Set();
    newExpKeyStates.active.forEach(function(key) {
      activeKeyStates.add(key);
    })

    const entryKeyStates = new Set();
    newExpKeyStates.entry.forEach(function(key) {
      entryKeyStates.add(key);
    })

    expKeyStates.set('active', activeKeyStates);
    expKeyStates.set('entry', entryKeyStates);
    newConfigKeyStates.set(eid, expKeyStates);
  });

  return newConfigKeyStates;
}

export function generateEffectiveGenome(expsKeyStates, genomes) {
  let effectiveGenome = {};
  const activeEids = new Set();
  expsKeyStates.forEach(function (expKeyStates, eid) {
    const active = expKeyStates.get('active');
    if (eid in genomes && active) {
      const activeGenome = objects.filter(genomes[eid], active);

      if (Object.keys(activeGenome).length) {
        activeEids.add(eid);
        effectiveGenome = objects.deepMerge(effectiveGenome, activeGenome);
      }
    }
  });

  return {
    effectiveGenome: effectiveGenome,
    activeEids: activeEids
  }
}

function EvolvStore(options) {
  const version = options.version || 1;
  const prefix = options.endpoint + '/' + options.environment;
  const keyId = options.auth && options.auth.id;
  const key = options.auth && options.auth.secret;

  let context;
  let clientContext = null;
  let initialized = false;
  let waitingToPull = false;
  let waitingToPullImmediate = true;
  let genomes = {};
  let effectiveGenome = {};
  let allocations = null;
  let config = null;
  let activeEids = new Set();
  let activeKeys = new Set();
  let genomeFailed = false;
  let configFailed = false;

  const genomeKeyStates = {
    needed: new Set(),
    requested: new Set(),
    loaded: new Set()
  };

  const configKeyStates = {
    needed: new Set(),
    requested: new Set(),
    loaded: new Set(),
    experiments: new Map()
  };

  let outstandingValuePromises = [];
  let outstandingConfigPromises = [];
  let subscriptions = new Set();

  Object.defineProperty(this, 'configuration', { get: function() { return config; }, configurable: true });
  Object.defineProperty(this, 'activeEids', { get: function() { return activeEids; }, configurable: true });

  this.destroy = function() {
    genomes = undefined;
    effectiveGenome = undefined;
    allocations = undefined;
    config = undefined;

    activeEids = undefined;
    activeKeys = undefined;

    delete genomeKeyStates.needed;
    delete genomeKeyStates.requested;
    delete genomeKeyStates.loaded;

    delete configKeyStates.needed;
    delete configKeyStates.requested;
    delete configKeyStates.loaded;
    delete configKeyStates.experiments;

    outstandingValuePromises.forEach(function(p) {
      p.reject();
    });
    outstandingValuePromises = undefined;
    outstandingConfigPromises.forEach(function(p) {
      p.reject();
    });
    outstandingConfigPromises = undefined;
    subscriptions = undefined;
    emit(context, STORE_DESTROYED, this);
    context = undefined;
  };

  function reevaluateContext() {
    if (!config) {
      return;
    }

    if (reevaluatingContext) {
      return;
    }
    reevaluatingContext = true;

    configKeyStates.experiments = setActiveAndEntryKeyStates(version, context, config, configKeyStates.experiments, genomeKeyStates.loaded);
    const result = generateEffectiveGenome(configKeyStates.experiments, genomes);

    effectiveGenome = result.effectiveGenome;
    activeEids = result.activeEids;

    const newActiveKeys = objects.flattenKeys(effectiveGenome);
    activeKeys.clear();
    newActiveKeys.forEach(function(key) {
      activeKeys.add(key);
    })
    context.set('keys.active', newActiveKeys);

    emit(context, EFFECTIVE_GENOME_UPDATED, effectiveGenome);
    subscriptions.forEach(function(listener) {
      try {
        listener(effectiveGenome, config);
      } catch (ex) {
        console.error(ex);
      }
    });

    reevaluatingContext = false;
  }

  function updateGenome(value) {
    const allocs = [];
    const exclusions = [];
    allocations = value;
    genomeFailed = false;
    value.forEach(function(alloc) {
      const clean = objects.assign({}, alloc);
      delete clean.genome;
      delete clean.audience_query;

      allocs.push(clean);
      if (clean.excluded) {
        exclusions.push(clean.eid);
        return;
      }

      genomes[clean.eid] = alloc.genome;
      objects.flattenKeys(alloc.genome, function(key) {
        return !strings.startsWith(key, '_');
      }).forEach(genomeKeyStates.loaded.add.bind(genomeKeyStates.loaded));
    });
    context.set('experiments.allocations', allocs);
    context.set('experiments.exclusions', exclusions);
  }

  function updateConfig(value) {
    config = value;
    configFailed = false;
    if ('_client' in config) {
      clientContext = config._client;
    }
    value._experiments.forEach(function(exp) {
      const clean = objects.assign({}, exp);
      delete clean.id;
      objects.flattenKeys(clean, function(key) {
        return !strings.startsWith(key, '_');
      }).forEach(configKeyStates.loaded.add.bind(configKeyStates.loaded));
    });
  }


  function update(configRequest, requestedKeys, value) {
    let keyStates = configRequest ? configKeyStates : genomeKeyStates;

    requestedKeys.forEach(keyStates.requested.delete.bind(keyStates.requested));
    if (configRequest) {
      emit(context, CONFIG_REQUEST_RECEIVED, requestedKeys);
      updateConfig(value);
    } else {
      emit(context, GENOME_REQUEST_RECEIVED, requestedKeys);
      updateGenome(value);
    }

    reevaluateContext();

    let removeConfig = [];
    let removeValue = [];
    outstandingValuePromises.concat(outstandingConfigPromises).forEach(function(promise) {
      if (promise.source === GENOME_SOURCE && (!promise.key || !genomeKeyStates.loaded.has(promise.key))) {
        return;
      }

      let configLoaded = true;
      if (promise.key) {
        configLoaded = false;
        configKeyStates.loaded.forEach(function(prefix) {
          if (strings.startsWith(promise.key, prefix)) {
            configLoaded = true;
          }
        });
      }

      if (!configLoaded && !(configRequest && (version === 1 || requestedKeys.indexOf(promise.key) >= 0))) {
        return;
      }

      promise.resolve(promise.transform(promise.key, effectiveGenome, config));
      (promise.source === CONFIG_SOURCE ? removeConfig : removeValue).push(promise);
    });

    outstandingValuePromises = outstandingValuePromises.filter(function(promise) {
      return removeValue.indexOf(promise) < 0;
    });

    outstandingConfigPromises = outstandingConfigPromises.filter(function(promise) {
      return removeConfig.indexOf(promise) < 0;
    });

    emit(context,configRequest ? CONFIG_UPDATED : GENOME_UPDATED, value);
  }

  function failed(configRequest, requestedKeys, err) {
    console.log(err);
    let keyStates;
    emit(context, REQUEST_FAILED, configRequest ? CONFIG_SOURCE : GENOME_SOURCE, requestedKeys, err);
    if (configRequest) {
      keyStates = configKeyStates;
    } else {
      keyStates = genomeKeyStates;
    }
    moveKeys(requestedKeys, keyStates.requested, keyStates.needed);

    let outstandingPromises;
    if (configRequest) {
      outstandingPromises = outstandingConfigPromises;
      configFailed = true;
    } else {
      outstandingPromises = outstandingValuePromises;
      genomeFailed = true;
    }

    let removeConfig = [];
    let removeValue = [];
    outstandingValuePromises.concat(outstandingConfigPromises).forEach(function(promise) {
      if (version === 1 || requestedKeys.indexOf(promise.key) >= 0) {
        (promise.source === CONFIG_SOURCE ? removeConfig : removeValue).push(promise);
        try {
          promise.reject(err);
        } catch (ex) {
          console.error(ex);
        }
      }
    });

    outstandingValuePromises = outstandingValuePromises.filter(function(promise) {
      return removeValue.indexOf(promise) >= 0;
    });

    outstandingConfigPromises = outstandingConfigPromises.filter(function(promise) {
      return removeConfig.indexOf(promise) >= 0;
    });

    if (configRequest) {
      outstandingConfigPromises = outstandingPromises;
    } else {
      outstandingValuePromises = outstandingPromises;
    }
  }

  function pull(immediate) {
    if (!initialized) {
      waitingToPullImmediate = waitingToPullImmediate || immediate;
      return;
    }

    if (!immediate && !waitingToPullImmediate) {
      if (!waitingToPull) {
        waitingToPull = true;
        setTimeout(pull.bind(undefined, true));
      }

      return;
    }

    waitingToPullImmediate = false;

    if (configKeyStates.needed.size || version === 1) {
      const requestedKeys = [];
      configKeyStates.needed.forEach(requestedKeys.push.bind(requestedKeys));
      configKeyStates.needed.clear();
      retrieve({
        method: 'get',
        url: prefix + '/' + context.uid + '/configuration.json',
        keyId: keyId,
        key: key
      })
        .then(update.bind(this, true, requestedKeys))
        .catch(failed.bind(this, true, requestedKeys));
      moveKeys(requestedKeys, configKeyStates.needed, configKeyStates.requested);
      emit(context, CONFIG_REQUEST_SENT, requestedKeys);
    }

    if (genomeKeyStates.needed.size || version === 1) {
      const requestedKeys = [];
      genomeKeyStates.needed.forEach(requestedKeys.push.bind(requestedKeys));
      genomeKeyStates.needed.clear();
      retrieve({
        method: 'post',
        encoding: 'application/x-www-form-urlencoded',
        url: prefix + '/allocations',
        keyId: keyId,
        key: key,
        data: {uid: context.uid, sid: context.sid}
      })
        .then(update.bind(this, false, requestedKeys))
        .catch(failed.bind(this, false, requestedKeys));
      moveKeys(requestedKeys, genomeKeyStates.needed, genomeKeyStates.requested);
      emit(context, GENOME_REQUEST_SENT, requestedKeys);
    }

    waitingToPull = false;
  }

  function createRequestSubscribablePromise(source, transform, key) {
    let resolve = null;
    let reject = null;
    const promise = MiniPromise.createPromise(function(res, rej) {
      resolve = wrapListener(res);
      reject = wrapListener(rej);
    });

    promise.listen = function(listener) {
      subscriptions.add(function(effectiveGenome, config) {
        listener(transform(key, effectiveGenome, config));
      });
    };

    let keyStates;
    let failed;
    let outstandingPromises;
    let loaded = false;
    if (source === GENOME_SOURCE) {
      keyStates = genomeKeyStates;
      failed = genomeFailed;
      outstandingPromises = outstandingValuePromises;
      loaded = keyStates.loaded.has(key);
    } else {
      keyStates = configKeyStates;
      failed = configFailed;
      outstandingPromises = outstandingConfigPromises;
      keyStates.loaded.forEach(function(prefix) {
        if (!key || strings.startsWith(key, prefix)) {
          loaded = true;
        }
      });
    }

    if (loaded) {
      resolve(transform(key, effectiveGenome, config));
      return promise;
    }

    if (keyStates.loaded.has(key)) {
      resolve(transform(key, effectiveGenome, config));
      return promise;
    }

    if (failed) {
      reject('The values could not be retrieved');
      return promise;
    }

    const outstanding = {
      key: key,
      resolve: resolve,
      reject: reject,
      transform: transform,
      source: source
    };
    outstandingPromises.push(outstanding);

    if (version !== 1 && !keyStates.needed.has(key) && !keyStates.requested.has(key)) {
      keyStates.needed.add(key);

      if (source === GENOME_SOURCE) {
        configKeyStates.needed.add(key);
      }

      pull();
    }

    return promise;
  }

  if (version === 1) {
    pull(true);
  } else if (options.version !== 2) {
    throw new Error('Unsupported API version');
  }

  Object.defineProperty(this, 'state', {
    get: function() {
      return {
        allocations: objects.deepClone(allocations),
        config: objects.deepClone(config)
      };
    }
  });

  this.fetch = pull.bind(this, true);

  this.preload = function(prefixes, configOnly, immediate) {
    prefixes.forEach(configKeyStates.needed.add.bind(configKeyStates.needed));

    if (!configOnly) {
      prefixes.forEach(genomeKeyStates.needed.add.bind(genomeKeyStates.needed));
    }
    pull(immediate);
  };

  this.initialize = function(_context) {
    if (initialized) {
      throw new Error('Evolv: The store has already been initialized.');
    }
    context = _context;
    initialized = true;
    pull();
    waitFor(context, CONTEXT_CHANGED, reevaluateContext);
  };

  this.getClientContext = function() {
    return createRequestSubscribablePromise.call(this, CONFIG_SOURCE, function() {
      return clientContext;
    });
  };

  this.subscribe = subscriptions.add.bind(subscriptions);
  this.unsubscribe = subscriptions.delete.bind(subscriptions);

  this.get = createRequestSubscribablePromise.bind(this, GENOME_SOURCE, getValue.bind(this));
  this.getConfig = createRequestSubscribablePromise.bind(this, CONFIG_SOURCE, getConfigValue.bind(this));
  this.activeEntryPoints = createRequestSubscribablePromise.bind(
    this, CONFIG_SOURCE, activeEntryPoints.bind(this, configKeyStates));
  this.isActive = createRequestSubscribablePromise.bind(
    this, CONFIG_SOURCE, getValueActive.bind(this, activeKeys));
  this.getActiveKeys = createRequestSubscribablePromise.bind(
    this, CONFIG_SOURCE, getActiveKeys.bind(this, activeKeys));
}

export default EvolvStore;
