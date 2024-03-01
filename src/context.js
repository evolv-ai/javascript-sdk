import * as objects from './ponyfills/objects.js';
import * as arrays from './helpers/arrays.js';
import { emit } from './waitforit.js';

export const CONTEXT_CHANGED = 'context.changed';
export const CONTEXT_INITIALIZED = 'context.initialized';
export const CONTEXT_VALUE_REMOVED = 'context.value.removed';
export const CONTEXT_VALUE_ADDED = 'context.value.added';
export const CONTEXT_VALUE_CHANGED = 'context.value.changed';
export const CONTEXT_DESTROYED = 'context.destroyed';

export const DEFAULT_QUEUE_LIMIT = 50;

/**
 * The EvolvContext provides functionality to manage data relating to the client state, or context in which the
 * variants will be applied.
 *
 * This data is used for determining which variables are active, and for general analytics.
 *
 * @constructor
 */
function EvolvContext(store) {
  let uid;
  let remoteContext;
  let localContext;
  let localStorageKey;
  let remoteStorageKey;

  const persistedKeys = [];
  const sessionPersistedKeys = [];

  let initialized = false;

  /**
   * A unique identifier for the participant.
   */
  Object.defineProperty(this, 'uid', { get: function() { return uid; } });

  /**
   * The context information for evaluation of predicates and analytics.
   */
  Object.defineProperty(this, 'remoteContext', { get: function() { return objects.deepClone(remoteContext); } });

  /**
   * The context information for evaluation of predicates only, and not used for analytics.
   */
  Object.defineProperty(this, 'localContext', { get: function() { return objects.deepClone(localContext); } });

  function mutableResolve() {
    return objects.deepMerge(localContext, remoteContext);
  }

  function ensureInitialized() {
    if (!initialized) {
      throw new Error('Evolv: The evolv context is not initialized')
    }
  }

  function mergePersistedContext(contextKey, context, storage) {
    const persistedContext = storage.getItem(contextKey);
    if (persistedContext) {
      const parsedContext = JSON.parse(persistedContext);
      if (context) {
        return objects.deepMerge(context, parsedContext);
      }

      return parsedContext;
    }

    return context || {};
  }

  function mergeAllPersistedStorage(contextKey, context) {
    if (window === undefined || !window.localStorage) {
      return context || {};
    }

    const localStorageContext = mergePersistedContext(contextKey, context, window.localStorage);
    return mergePersistedContext(contextKey, localStorageContext, window.sessionStorage);
  }

  function persistValue(key, value, local, sessionOnly) {
    const storage = sessionOnly ? window.sessionStorage : window.localStorage;
    const persistedContext = storage.getItem(local ? localStorageKey : remoteStorageKey);
    const context = persistedContext ? JSON.parse(persistedContext) : {};
    objects.setKeyToValue(key, value, context);
    storage.setItem(local ? localStorageKey : remoteStorageKey, JSON.stringify(context));
  }

  this.initialize = function(_uid, _remoteContext, _localContext) {
    if (initialized) {
      throw new Error('Evolv: The context is already initialized');
    }
    uid = _uid;

    localStorageKey = 'evolv_' + this.uid + '_local_context';
    remoteStorageKey = 'evolv_' + this.uid + '_remote_context';

    localContext = mergeAllPersistedStorage(localStorageKey, _localContext);
    remoteContext = mergeAllPersistedStorage(remoteStorageKey, _remoteContext);
    initialized = true;
    emit(this, CONTEXT_INITIALIZED, this.resolve());
  };

  this.destroy = function() {
    remoteContext = undefined;
    localContext = undefined;
    emit(this, CONTEXT_DESTROYED, this);
  };

  /**
   * Computes the effective context from the local and remote contexts.
   *
   * @returns {Object} The effective context from the local and remote contexts.
   */
  this.resolve = function() {
    ensureInitialized();
    return objects.deepClone(mutableResolve());
  };

  /**
   * Returns true if a context key is persisted.
   *
   * @param {String} key The key to associate the value to.
   */

  this.isPersisted = function(key) {
    return persistedKeys.indexOf(key) >= 0 || sessionPersistedKeys.indexOf(key) >= 0;
  }

  /**
   * Sets a value in the current context.
   *
   * Note: This will cause the effective genome to be recomputed.
   *
   * @param {String} key The key to associate the value to.
   * @param {*} value  The value to associate with the key.
   * @param {Boolean} [local = false] If true, the value will only be added to the localContext.
   */
  this.set = function(key, value, local) {
    ensureInitialized();
    const context = local ? localContext : remoteContext;
    const before = objects.getValueForKey(key, context);

    if (before === value || arrays.arraysEqual(before, value)) {
      return false;
    }

    objects.setKeyToValue(key, value, context);
    if (this.isPersisted(key)) {
      persistValue(key, value, local, sessionPersistedKeys.indexOf(key) >= 0);
    }

    const updated = this.resolve();
    if (typeof before === 'undefined') {
      emit(this, CONTEXT_VALUE_ADDED, key, value, local, updated);
    } else {
      emit(this, CONTEXT_VALUE_CHANGED, key, value, before, local, updated);
    }
    emit(this, CONTEXT_CHANGED, updated);
    return true;
  };

  /**
   * Persist context key to sessionStorage.
   *
   * @param {String} key The key to persist.
   * @param {boolean} [sessionOnly] If true, the value will only be persisted to sessionStorage.
   *   Default: true
   */
  this.persist = function(key, sessionOnly) {
    ensureInitialized();

    if (window === undefined || !window.localStorage) {
      console.log('Evolv: Unable to persist context key. LocalStorage is not available.');
      return;
    }

    const keys = sessionOnly === false ? persistedKeys : sessionPersistedKeys;
    if (!keys.indexOf(key)) {
      keys.push(key);
    }

    const local = objects.hasKey(key, localContext);
    const value = objects.getValueForKey(key, local ? localContext : remoteContext);
    persistValue(key, value, local, sessionOnly);
  }

  /**
   * Merge the specified object into the current context.
   *
   * Note: This will cause the effective genome to be recomputed.
   *
   * @param {Object} update The values to update the context with.
   * @param {Boolean} [local = false] If true, the values will only be added to the localContext.
   */
  this.update = function(update, local) {
    if (Object.keys(update).length === 0 && update.constructor === Object) {
      // We will deprecate this at some point.
      console.warn('[Deprecation] Calling evolv.context.update({}) to reapply variants has been deprecated. Please use \'evolv.rerun()\' instead.');
      store.clearActiveKeys();
    }

    ensureInitialized();
    let context = local ? localContext : remoteContext;
    const flattened = objects.flatten(update);
    const flattenedBefore = {};
    Object.keys(flattened).forEach(function(key) {
      flattenedBefore[key] = context[key];
    });

    if (local) {
      localContext = objects.deepMerge(localContext, update);
      context = localContext;
    } else {
      remoteContext = objects.deepMerge(remoteContext, update);
      context = remoteContext;
    }

    const thisRef = this;
    const updated = this.resolve();
    Object.keys(flattened).forEach(function(key) {
      if (typeof flattenedBefore[key] === 'undefined') {
        emit(thisRef, CONTEXT_VALUE_ADDED, key, flattened[key], local, updated);
      } else if (flattenedBefore[key] !== context[key]) {
        emit(thisRef, CONTEXT_VALUE_CHANGED, key, flattened[key], flattenedBefore[key], local, updated);
      }
    });
    emit(this, CONTEXT_CHANGED, updated);
  };

  /**
   * Remove a specified key from the context.
   *
   * Note: This will cause the effective genome to be recomputed.
   *
   * @param key {String} The key to remove from the context.
   * @return boolean
   */
  this.remove = function(key) {
    ensureInitialized();
    const local = objects.removeValueForKey(key, localContext);
    const remote = objects.removeValueForKey(key, remoteContext);
    const removed = local || remote;

    if (removed) {
      const updated = this.resolve();
      emit(this, CONTEXT_VALUE_REMOVED, key, !remote, updated);
      emit(this, CONTEXT_CHANGED, updated);
    }

    return removed;
  };

  /**
   * Retrieve a value from the context.
   *
   * @param {String} key The key associated with the value to retrieve.
   * @returns {*} The value associated with the specified key.
   */
  this.get = function(key) {
    ensureInitialized();

    // Remove me when 'confirmations' and 'contaminations' are no longer set
    if (key === 'confirmations' || key === 'contaminations') {
      console.warn('[Deprecation] Retrieving confirmations and contaminations from the Evolv context with keys "confirmations"',
       ' and "contaminations" is deprecated. Please use "experiments.confirmations" and "experiments.contaminations" instead.');
    }

    return objects.getValueForKey(key,
      objects.hasKey(key, remoteContext)? remoteContext : localContext);
  };

  /**
   * Checks if the specified key is currently defined in the context.
   *
   * @param key The key to check.
   * @returns {boolean} True if the key has an associated value in the context.
   */
  this.contains = function(key) {
    ensureInitialized();
    return key in remoteContext || key in localContext;
  };

  /**
   * Adds value to specified array in context. If array doesn't exist its created and added to.
   *
   * @param {String} key The array to add to.
   * @param {*} value Value to add to the array.
   * @param {Boolean} [local = false] If true, the value will only be added to the localContext.
   * @param {Number} [limit] Max length of array to maintain.
   * @returns {boolean} True if value was successfully added.
   */
  this.pushToArray = function(key, value, local, limit) {
    limit = limit || DEFAULT_QUEUE_LIMIT;

    ensureInitialized();

    const context = local ? localContext : remoteContext;
    const originalArray = objects.getValueForKey(key, context);

    const combined = (originalArray || []).concat([value]);
    const newArray = combined.slice(combined.length - limit);

    return this.set(key, newArray, local);
  }
}

export default EvolvContext;
