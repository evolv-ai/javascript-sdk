import Context, {
  CONTEXT_INITIALIZED,
  CONTEXT_VALUE_ADDED,
  CONTEXT_VALUE_CHANGED,
  CONTEXT_VALUE_REMOVED
} from './context.js';

import Store, { EFFECTIVE_GENOME_UPDATED, REQUEST_FAILED } from './store.js';
import { waitFor, waitOnceFor, emit, destroyScope, removeListener } from './waitforit.js';
import Beacon from './beacon.js';
import { assign } from './ponyfills/objects.js';
import { buildOptions } from './build-options.js';
import MiniPromise from './ponyfills/minipromise.js';

/**
 * @typedef {Promise} SubscribablePromise
 * @description Object similar to a standard Promise but which can also be subscribed to to observe subsequent values
 *              Note that the standard promise methods will only handle the first calls to `resolve()` or `reject()`.
 * @property {function(function):undefined} then Equivalent to `Promise.then()`
 * @property {function(function):function} listen Subscribes listener to the promise. Returns a function that can be called to unsubscribe
 * @property {function(function):undefined} catch Equivalent to `Promise.catch()`
 * @property {function(function):undefined} finally Equivalent to `Promise.finally()`
 */

/**
 * @callback Listener
 * @param {string} eventName
 * @param {...*} args
 */

/**
 * The EvolvClient provides a low level integration with the Evolv participant APIs.
 *
 * The client provides asynchronous access to key states, values, contexts, and configurations.
 *
 * @param opts {Partial<EvolvClientOptions>} An object of options for the client.
 * @constructor
 */
function EvolvClient(opts) {
  let initialized = false;

  const options = buildOptions(opts);

  const store = options.store || new Store(options);
  const context = options.context || new Context(store);

  /** @type Partial<EmitterOptions> */
  const beaconOptions = {
    blockTransmit: options.bufferEvents,
    clientName: options.clientName
  };

  const contextBeacon = options.analytics ? new Beacon(options.endpoint + '/' + options.environment + '/data', context, beaconOptions) : null;
  const eventBeacon = options.beacon || new Beacon(options.endpoint + '/' + options.environment + '/events', context, beaconOptions);

  /**
   * The context against which the key predicates will be evaluated.
   */
  Object.defineProperty(this, 'context', { get: function() { return context; } });

  /**
   * The current environment id.
   */
  Object.defineProperty(this, 'environment', { get: function() { return options.environment; } });

  /**
   * Add listeners to lifecycle events that take place in to client.
   *
   * Currently supported events:
   * * "initialized" - Called when the client is fully initialized and ready for use with (topic, options)
   * * "context.initialized" - Called when the context is fully initialized and ready for use with (topic, updated_context)
   * * "context.changed" - Called whenever a change is made to the context values with (topic, updated_context)
   * * "context.value.removed" - Called when a value is removed from context with (topic, key, updated_context)
   * * "context.value.added" - Called when a new value is added to the context with (topic, key, value, local, updated_context)
   * * "context.value.changed" - Called when a value is changed in the context (topic, key, value, before, local, updated_context)
   * * "context.destroyed" - Called when the context is destroyed with (topic, context)
   * * "genome.request.sent" - Called when a request for a genome is sent with (topic, requested_keys)
   * * "config.request.sent" - Called when a request for a config is sent with (topic, requested_keys)
   * * "genome.request.received" - Called when the result of a request for a genome is received (topic, requested_keys)
   * * "config.request.received" - Called when the result of a request for a config is received (topic, requested_keys)
   * * "request.failed" - Called when a request fails (topic, source, requested_keys, error)
   * * "genome.updated" - Called when the stored genome is updated (topic, allocation_response)
   * * "config.updated" - Called when the stored config is updated (topic, config_response)
   * * "effective.genome.updated" - Called when the effective genome is updated (topic, effectiveGenome)
   * * "store.destroyed" - Called when the store is destroyed (topic, store)
   * * "confirmed" - Called when the consumer is confirmed (topic)
   * * "contaminated" - Called when the consumer is contaminated (topic)
   * * "event.emitted" - Called when an event is emitted through the beacon (topic, type, score)
   *
   * @param {String} topic The event topic on which the listener should be invoked.
   * @param {Listener} listener The listener to be invoked for the specified topic.
   * @method
   * @see {@link EvolvClient#once} for listeners that should only be invoked once.
   */
  this.on = waitFor.bind(undefined, context);

  /**
   * Add a listener to a lifecycle event to be invoked once on the next instance of the
   * event to take place in to client.
   *
   * See the "on" function for supported events.
   *
   * @param {String} topic The event topic on which the listener should be invoked.
   * @param {Listener} listener The listener to be invoked for the specified topic.
   * @method
   * @see {@link EvolvClient#on} for listeners that should be invoked on each event.
   */
  this.once = waitOnceFor.bind(undefined, context);

  /**
   * Remove a listener from a lifecycle event.
   *
   * See the "on" function for supported events.
   *
   * @param {String} topic The event topic from which the listener should be removed.
   * @param {Listener} listener The listener to be removed from the specified topic.
   * @method
   * @see {@link EvolvClient#on} for listeners that should be invoked on each event.
   */
  this.off = removeListener.bind(undefined, context);

  /**
   * Preload all keys under the specified prefixes.
   *
   * @param {Array.<String>} prefixes A list of prefixes to keys to load.
   * @param {Boolean} [configOnly = false] If true, only the config would be loaded.
   * @param {Boolean} [immediate = false] Forces the requests to the server.
   * @method
   */
  this.preload = store.preload.bind(store);

  /**
   * Get the value of a specified key.
   *
   * @param {String} key The key of the value to retrieve.
   * @returns {SubscribablePromise.<*|Error>} A SubscribablePromise that resolves to the value of the specified key.
   * @method
   */
  this.get = store.get.bind(store);

  /**
   * Check if a specified key is currently active.
   *
   * @param {String} key The key to check.
   * @returns {SubscribablePromise.<Boolean|Error>} A SubscribablePromise that resolves to true if the specified key is
   * active.
   * @method
   */
  this.isActive = store.isActive.bind(store);

  /**
   * Check all active keys that start with the specified prefix.
   *
   * @param {String} [prefix] The prefix of the keys to check.
   * @returns {SubscribablePromise.<{ current: string[], previous: string[] }|Error>} A SubscribablePromise that resolves to object
   * describing the state of active keys.
   * @method
   */
  this.getActiveKeys = store.getActiveKeys.bind(store);

  /**
   * Clears the active keys to reset the key states.
   *
   * @param {String} [prefix] The prefix of the keys clear.
   * @method
   * @deprecated
   */
  this.clearActiveKeys = store.clearActiveKeys.bind(store);

  /**
   * Reevaluates the current context.
   *
   * @method
   */
  this.reevaluateContext = store.reevaluateContext.bind(store);

  /**
   * Get the configuration for a specified key.
   *
   * @param {String} key The key to retrieve the configuration for.
   * @returns {SubscribablePromise.<*|Error>} A SubscribablePromise that resolves to the configuration of the
   * specified key.
   * @method
   */
  this.getConfig = store.getConfig.bind(store);

  /**
   * Get the configuration for a specified key.//TODO
   *
   * @param {String} type The type of entity we're retrieving the display name for. Allow values: 'experiments'
   * @param {String} key The key/id to retrieve the display name for.
   * @returns {SubscribablePromise.<*|Error>} A SubscribablePromise that resolves to the configuration of the
   * specified key.
   * @method
   */
   this.getDisplayName = store.getDisplayName.bind(store);

  /**
   * Send an event to the events endpoint.
   *
   * @param {String} type The type associated with the event.
   * @param {Object} [metadata] Any metadata to attach to the event.
   * @param {Boolean} [flush = false] If true, the event will be sent immediately.
   */
  this.emit = function(type, metadata, flush) {
    context.pushToArray('events', {type: type,  timestamp: (new Date()).getTime()});
    eventBeacon.emit(type, assign({
      uid: context.uid,
      metadata: metadata
    }), flush);
    emit(context, EvolvClient.EVENT_EMITTED, type, metadata);
  };

  // TODO AP-2318 prevent sending confirmations when every stat comes from analytics. Prior to that, these are still needed
  /*let getSessionBasedExps = function() {
    let sessionBasedExps = {};

    ((store.configuration && store.configuration._experiments) || []).forEach(function(experiment) {
      if (experiment._optimization_metric === 'SESSION') {
        sessionBasedExps[experiment.id] = true;
      }
    });

    return sessionBasedExps;
  }*/

  /**
   * Confirm that the consumer has successfully received and applied values, making them eligible for inclusion in
   * optimization statistics.
   */
  this.confirm = function() {
    // eslint-disable-next-line es/no-promise
    return new MiniPromise.createPromise(function(resolve) {
      waitFor(context, EFFECTIVE_GENOME_UPDATED,function() {
        const remoteContext = context.remoteContext;
        const allocations = (remoteContext.experiments || {}).allocations // undefined is a valid state, we want to know if its undefined
        if (!store.configuration || !allocations || !allocations.length) {
          resolve();
          return;
        }

        // TODO AP-2318 prevent sending confirmations when every stat comes from analytics. Prior to that, these are still needed
        // const sessionBasedExps = getSessionBasedExps();

        store.activeEntryPoints()
          .then(function(entryPointEids) {
            if (!entryPointEids.length) {
              resolve();
              return;
            }

            const confirmations = context.get('experiments.confirmations') || [];
            const confirmedCids = confirmations.map(function(conf) {
              return conf.cid;
            });
            const contaminations = context.get('experiments.contaminations') || [];
            const contaminatedCids = contaminations.map(function(cont) {
              return cont.cid;
            });
            const confirmableAllocations = allocations.filter(function(alloc) {
              return confirmedCids.indexOf(alloc.cid) < 0 && contaminatedCids.indexOf(alloc.cid) < 0 && store.activeEids.has(alloc.eid) && entryPointEids.indexOf(alloc.eid) >= 0;
            });

            if (!confirmableAllocations.length) {
            resolve();
            return;
          }

            const timestamp = (new Date()).getTime();
            const contextConfirmations = confirmableAllocations.map(function(alloc) {
              return {
                cid: alloc.cid,
                timestamp: timestamp
              }
            });


            context.set('experiments.confirmations', contextConfirmations.concat(confirmations));

            confirmableAllocations.forEach(function(alloc) {
              // Only confirm for non session based experiments -- session based use the analytics data
              // TODO AP-2318 prevent sending confirmations when every stat comes from analytics. Prior to that, these are still needed
              // !sessionBasedExps[alloc.eid] && eventBeacon.emit('confirmation', {
              eventBeacon.emit('confirmation', {
                uid: alloc.uid,
                eid: alloc.eid,
                cid: alloc.cid
              });
            });

            eventBeacon.flush();
            emit(context, EvolvClient.CONFIRMED);
            resolve();
            return;
          });
      });
    });

  };

  /**
   * Marks a consumer as unsuccessfully retrieving and / or applying requested values, making them ineligible for
   * inclusion in optimization statistics.
   *
   * @param {Object} [details] Information on the reason for contamination. If provided, the object should
   * contain a reason. Optionally, a 'details' value should be included for extra debugging info
   * @param {boolean} [allExperiments = false] If true, the user will be excluded from all optimizations, including optimization
   * not applicable to this page
   */
  this.contaminate = function(details, allExperiments) {
    const remoteContext = context.remoteContext;
    const allocations = (remoteContext.experiments || {}).allocations; // undefined is a valid state, we want to know if its undefined
    if (!allocations || !allocations.length) {
      return;
    }

    if (details && !details.reason) {
      throw new Error('Evolv: contamination details must include a reason');
    }

    const contaminations = context.get('experiments.contaminations') || [];
    const contaminatedCids = contaminations.map(function(conf) {
      return conf.cid;
    });
    const contaminatableAllocations = allocations.filter(function(alloc) {
      return contaminatedCids.indexOf(alloc.cid) < 0 && (allExperiments || store.activeEids.has(alloc.eid));
    });

    if (!contaminatableAllocations.length) {
      return;
    }

    const timestamp = (new Date()).getTime();
    const contextContaminations = contaminatableAllocations.map(function(alloc) {
      return {
        cid: alloc.cid,
        timestamp: timestamp,
        contaminationReason: details
      }
    });

    context.set('experiments.contaminations', contextContaminations.concat(contaminations));

    contaminatableAllocations.forEach(function(alloc) {
      eventBeacon.emit('contamination', {
        uid: alloc.uid,
        eid: alloc.eid,
        cid: alloc.cid,
        contaminationReason: details
      });
    });
    eventBeacon.flush();
    emit(context, EvolvClient.CONTAMINATED);
  };

  /**
   * Initializes the client with required context information.
   *
   * @param {String} uid A globally unique identifier for the current participant.
   * @param {Object} [remoteContext] A map of data used for evaluating context predicates and analytics.
   * @param {Object} [localContext] A map of data used only for evaluating context predicates.
   */
  this.initialize = function (uid, remoteContext, localContext) {
    if (initialized) {
      throw new Error('Evolv: Client is already initialized');
    }

    if (!uid) {
      throw new Error('Evolv: "uid" must be specified');
    }

    context.initialize(uid, remoteContext, localContext);
    store.initialize(context);

    store.getClientContext()
      .then(function(c) {
        if (!c) {
          return;
        }

        const updated = assign({}, c);
        if (updated.browser) {
          updated.web = {
            client: {
              browser: updated.browser
            }
          };
          delete updated.browser;
        }

        context.update(updated, false);
      })
      .catch(function() {
        console.log('Evolv: Failed to retrieve client context');
      });

    if (options.analytics) {
      /*eslint no-unused-vars: ["error", { "argsIgnorePattern": "ctx" }]*/
      waitFor(context, CONTEXT_INITIALIZED, function (type, ctx) {
        contextBeacon.emit(type, context.remoteContext);
      });
      waitFor(context, CONTEXT_VALUE_ADDED, function (type, key, value, local) {
        if (local) {
          return;
        }

        contextBeacon.emit(type, {key: key, value: value});
      });
      waitFor(context, CONTEXT_VALUE_CHANGED, function (type, key, value, before, local) {
        if (local) {
          return;
        }

        contextBeacon.emit(type, {key: key, value: value});
      });
      waitFor(context, CONTEXT_VALUE_REMOVED, function (type, key, local) {
        if (local) {
          return;
        }

        contextBeacon.emit(type, {key: key});
      });
    }

    if (options.autoConfirm) {
      this.confirm();
      waitFor(context, REQUEST_FAILED, this.contaminate.bind(this));
    }

    initialized = true;
    emit(context, EvolvClient.INITIALIZED, options);
  };

  /**
   * Force all beacons to transmit.
   */
  this.flush = function() {
    eventBeacon.flush();
    if (options.analytics) {
      contextBeacon.flush();
    }
  };

  /**
   * If the client was configured with
   * bufferEvents: true
   * then calling this will allow data to be sent back to Evolv
   */
  this.allowEvents = function() {
    eventBeacon.unblockAndFlush();
    if (options.analytics) {
      contextBeacon.unblockAndFlush();
    }
  };

  /**
   * Destroy the client and its dependencies.
   */
  this.destroy = function () {
    this.flush();
    store.destroy();
    context.destroy();
    destroyScope(context);
  };
}

EvolvClient.INITIALIZED = 'initialized';
EvolvClient.CONFIRMED = 'confirmed';
EvolvClient.CONTAMINATED = 'contaminated';
EvolvClient.EVENT_EMITTED = 'event.emitted';

export default EvolvClient;
export { default as MiniPromise } from './ponyfills/minipromise.js'
