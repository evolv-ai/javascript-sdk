import Context, {
  CONTEXT_INITIALIZED,
  CONTEXT_VALUE_ADDED,
  CONTEXT_VALUE_CHANGED,
  CONTEXT_VALUE_REMOVED
} from './context.js';

import Store, { EFFECTIVE_GENOME_UPDATED, REQUEST_FAILED } from './store.js';
import { waitFor, waitOnceFor, emit, destroyScope } from './waitforit.js';
import Beacon from './beacon.js';
import { assign } from './ponyfills/objects.js';

/**
 * @typedef {Promise} SubscribablePromise
 * @property {function(function):undefined} then Then
 * @property {function(function):undefined} listen Listen
 * @property {function(function):undefined} catch Catch
 * @property {function(function):undefined} finally Finally
 */

/**
 * The EvolvClient provides a low level integration with the Evolv participant APIs.
 *
 * The client provides asynchronous access to key states, values, contexts, and configurations.
 *
 * @param options {Object} An object of options for the client.
 * @constructor
 */
function EvolvClient(options) {
  let initialized = false;

  if (!options.environment) {
    throw new Error('"environment" must be specified');
  }

  if (!('autoConfirm' in options)) {
    options.autoConfirm = true;
  }

  options.version = options.version || 1;
  options.endpoint = (options.endpoint || 'https://participants.evolv.ai/') + 'v' + options.version;
  options.analytics = 'analytics' in options ? options.analytics : options.version > 1;

  const store = options.store || new Store(options);
  const context = options.context || new Context(store);
  const contextBeacon = options.analytics ? new Beacon(options.endpoint + '/' + options.environment + '/data', context, options.bufferEvents) : null;
  const eventBeacon = options.beacon || new Beacon(options.endpoint + '/' + options.environment + '/events', context, options.bufferEvents);

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
   * @param {Function} listener The listener to be invoked for the specified topic.
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
   * @param {Function} listener The listener to be invoked for the specified topic.
   * @method
   * @see {@link EvolvClient#on} for listeners that should be invoked on each event.
   */
  this.once = waitOnceFor.bind(undefined, context);

  /**
   * Preload all keys under under the specified prefixes.
   *
   * @param {Array.<String>} prefixes A list of prefixes to keys to load.
   * @param {Boolean} configOnly If true, only the config would be loaded. (default: false)
   * @param {Boolean} immediate Forces the requests to the server. (default: false)
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
   * @param {String} prefix The prefix of the keys to check.
   * @returns {SubscribablePromise.<Object|Error>} A SubscribablePromise that resolves to object
   * describing the state of active keys.
   * @method
   */
  this.getActiveKeys = store.getActiveKeys.bind(store);

  /**
   * Clears the active keys to reset the key states.
   *
   * @param {String} prefix The prefix of the keys clear.
   * @method
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
   * Send an event to the events endpoint.
   *
   * @param {String} type The type associated with the event.
   * @param metadata {Object} Any metadata to attach to the event.
   * @param flush {Boolean} If true, the event will be sent immediately.
   */
  this.emit = function(type, metadata, flush) {
    context.pushToArray('events', {type: type,  timestamp: (new Date()).getTime()});
    eventBeacon.emit(type, assign({
      uid: context.uid,
      sid: context.sid,
      metadata: metadata
    }), flush);
    emit(context, EvolvClient.EVENT_EMITTED, type, metadata);
  };

  /**
   * Confirm that the consumer has successfully received and applied values, making them eligible for inclusion in
   * optimization statistics.
   */
  this.confirm = function() {
    waitFor(context, EFFECTIVE_GENOME_UPDATED, function() {
      const remoteContext = context.remoteContext;
      const allocations = (remoteContext.experiments || {}).allocations // undefined is a valid state, we want to know if its undefined
      if (!store.configuration || !allocations || !allocations.length) {
        return;
      }

      store.activeEntryPoints()
        .then(function(entryPointEids) {
          if (!entryPointEids.length) {
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
            return confirmedCids.indexOf(alloc.cid) < 0 && contaminatedCids.indexOf(alloc.cid) < 0 && store.activeEids.has(alloc.eid);
          });

          if (!confirmableAllocations.length) {
            return;
          }

          const timestamp = (new Date()).getTime();
          const contextConfirmations = confirmableAllocations.map(function(alloc) {
            return {
              cid: alloc.cid,
              timestamp: timestamp
            }
          });

          // We will deprecate 'confirmations' in favor of 'experiments.confirmations'
          // When deprecated delete below and uncomment next line
          // context.set('experiments.confirmations', contextConfirmations.concat(confirmations));
          const newConfirmations = contextConfirmations.concat(confirmations);
          context.update({
            'confirmations': newConfirmations,
            'experiments': {
              'confirmations': newConfirmations
            }
          });

          confirmableAllocations.forEach(function(alloc) {
            eventBeacon.emit('confirmation', assign({
              uid: alloc.uid,
              sid: alloc.sid,
              eid: alloc.eid,
              cid: alloc.cid
            }, context.remoteContext));
          });

          eventBeacon.flush();
          emit(context, EvolvClient.CONFIRMED);
        });
    });
  };

  /**
   * Marks a consumer as unsuccessfully retrieving and / or applying requested values, making them ineligible for
   * inclusion in optimization statistics.
   *
   * @param details {Object} Optional. Information on the reason for contamination. If provided, the object should
   * contain a reason. Optionally, a 'details' value should be included for extra debugging info
   * @param {boolean} allExperiments If true, the user will be excluded from all optimizations, including optimization
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
        timestamp: timestamp
      }
    });

    // We will deprecate 'contaminations' in favor of 'experiments.contaminations'
    // When deprecated delete below and uncomment next line
    // context.set('experiments.contaminations', contextContaminations.concat(contaminations));
    const newContaminations = contextContaminations.concat(contaminations);
    context.update({
      'contaminations': newContaminations,
      'experiments': {
        'contaminations': newContaminations
      }
    });

    contaminatableAllocations.forEach(function(alloc) {
      eventBeacon.emit('contamination', assign({
        uid: alloc.uid,
        sid: alloc.sid,
        eid: alloc.eid,
        cid: alloc.cid,
        contaminationReason: details
      }, context.remoteContext));
    });
    eventBeacon.flush();
    emit(context, EvolvClient.CONTAMINATED);
  };

  /**
   * Initializes the client with required context information.
   *
   * @param {String} uid A globally unique identifier for the current participant.
   * @param {String} sid A globally unique session identifier for the current participant.
   * @param {Object} remoteContext A map of data used for evaluating context predicates and analytics.
   * @param {Object} localContext A map of data used only for evaluating context predicates.
   */
  this.initialize = function (uid, sid, remoteContext, localContext) {
    if (initialized) {
      throw new Error('Evolv: Client is already initialized');
    }

    if (!uid) {
      throw new Error('Evolv: "uid" must be specified');
    }

    if (!sid) {
      throw new Error('Evolv: "sid" must be specified');
    }

    context.initialize(uid, sid, remoteContext, localContext);
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
