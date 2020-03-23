import Context, {
  CONTEXT_INITIALIZED,
  CONTEXT_VALUE_ADDED,
  CONTEXT_VALUE_CHANGED,
  CONTEXT_VALUE_REMOVED
} from './context.js';

import Store, {EFFECTIVE_GENOME_UPDATED, REQUEST_FAILED} from './store.js';
import { waitFor, waitOnceFor, emit, destroyScope } from './waitforit.js';
import Beacon from './beacon.js';
import { assign } from './ponyfills/objects.js';

export const INITIALIZED = 'initialized';
export const CONFIRMED = 'confirmed';
export const CONTAMINATED = 'contaminated';
export const EVENT_EMITTED = 'event.emitted';

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

  if (!options.env) {
    throw new Error('"env" must be specified');
  }

  if (typeof options.autoConfirm === 'undefined') {
    options.autoConfirm = true;
  }

  options.endpoint = options.endpoint || 'https://participants.evolv.ai/';
  options.version = options.version || 1;

  const context = new Context(options);
  const store = new Store(options);
  const contextBeacon = new Beacon(options.endpoint + '/' + options.env + '/analytics');
  const eventBeacon = new Beacon(options.endpoint + '/' + options.env + '/events');

  /**
   * The context against which the key predicates will be evaluated.
   */
  Object.defineProperty(this, 'context', { get: function() { return context; } });

  /**
   * Add listeners to lifecycle events that take place in to client.
   *
   * Currently supported events:
   * * INITIALIZED - Called when the client is fully initialized and ready for use with (topic, options)
   * * CONTEXT_INITIALIZED = Called when the context is fully initialized and ready for use with (topic, updated_context)
   * * CONTEXT_CHANGED - Called whenever a change is made to the context values with (topic, updated_context)
   * * CONTEXT_VALUE_REMOVED - Called when a value is removed from context with (topic, key, local, updated_context)
   * * CONTEXT_VALUE_ADDED - Called when a new value is added to the context with (topic, key, value, local, updated_context)
   * * CONTEXT_VALUE_CHANGED - Called when a value is changed in the context (topic, key, value, before, local, updated_context)
   * * CONTEXT_DESTROYED - Called when the context is destroyed with (topic, context)
   * * GENOME_REQUEST_SENT - Called when a request for a genome is sent with (topic, requested_keys)
   * * CONFIG_REQUEST_SENT - Called when a request for a config is sent with (topic, requested_keys)
   * * GENOME_REQUEST_RECEIVED - Called when the result of a request for a genome is received (topic, requested_keys)
   * * CONFIG_REQUEST_RECEIVED - Called when the result of a request for a config is received (topic, requested_keys)
   * * REQUEST_FAILED - Called when a request fails (topic, source, requested_keys, error)
   * * GENOME_UPDATED - Called when the stored genome is updated (topic, allocation_response)
   * * CONFIG_UPDATED - Called when the stored config is updated (topic, config_response)
   * * EFFECTIVE_GENOME_UPDATED - Called when the effective genome is updated (topic, effectiveGenome)
   * * STORE_DESTROYED - Called when the store is destroyed (topic, store)
   * * CONFIRMED - Called when the consumer is confirmed (topic)
   * * CONTAMINATED - Called when the consumer is contaminated (topic)
   * * EVENT_EMITTED - Called when an event is emitted through the beacon (topic, type, score)
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
  this.preload = store.preload.bind(store);
  this.get = store.get.bind(store);
  this.isActive = store.isActive.bind(store);
  this.getActiveKeys = store.getActiveKeys.bind(store);
  this.getConfig = store.getConfig.bind(store);
  this.emit = function(type, score, flush) {
    eventBeacon.emit(type, assign({score: score}, context.remoteContext), flush);
    emit(context, EVENT_EMITTED, type, score);
  };
  this.confirm = function() {
    eventBeacon.emit('confirmation', context.remoteContext, true);
    emit(context, CONFIRMED);
  };
  this.contaminate = function() {
    eventBeacon.emit('contaminated', context.remoteContext, true);
    emit(context, CONTAMINATED);
  };

  this.initialize = function (uid, sid, remoteContext, localContext) {
    if (initialized) {
      throw Error('Evolv: Client is already initialized');
    }

    if (!uid) {
      throw new Error('Evolv: "uid" must be specified');
    }

    if (!sid) {
      throw new Error('Evolv: "sid" must be specified');
    }

    context.initialize(uid, sid, remoteContext, localContext);
    store.initialize(context);

    waitFor(context, CONTEXT_INITIALIZED, function(type, ctx) {
      contextBeacon.emit(type, context.remoteContext);
    });
    waitFor(context, CONTEXT_VALUE_ADDED, function(type, key, value, local) {
      if (local) {
        return;
      }

      contextBeacon.emit(type, { key: key, value: value });
    });
    waitFor(context, CONTEXT_VALUE_CHANGED, function(type, key, value, before, local) {
      if (local) {
        return;
      }

      contextBeacon.emit(type, { key: key, value: value });
    });
    waitFor(context, CONTEXT_VALUE_REMOVED, function(type, key, local) {
      if (local) {
        return;
      }

      contextBeacon.emit(type, { key: key });
    });

    if (options.autoConfirm) {
      waitFor(EFFECTIVE_GENOME_UPDATED, this.confirm.bind(this));
      waitFor(REQUEST_FAILED, this.contaminate.bind(this));
    }

    initialized = true;
    emit(context, INITIALIZED, options);
  };

  this.flush = function() {
    eventBeacon.flush();
    contextBeacon.flush();
  };

  this.destroy = function () {
    this.flush();
    store.destroy();
    context.destroy();
    destroyScope(context);
  };
}

export default EvolvClient;
