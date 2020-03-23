import * as objects from './ponyfills/objects.js';
import { emit } from './waitforit.js';

export const CONTEXT_CHANGED = 'context.changed';
export const CONTEXT_INITIALIZED = 'context.initialized';
export const CONTEXT_VALUE_REMOVED = 'context.value.removed';
export const CONTEXT_VALUE_ADDED = 'context.value.added';
export const CONTEXT_VALUE_CHANGED = 'context.value.changed';
export const CONTEXT_DESTROYED = 'context.destroyed';

function EvolvContext() {
  let uid;
  let sid;
  let remoteContext;
  let localContext;
  let initialized = false;

  Object.defineProperty(this, 'uid', { get: function() { return uid; } });
  Object.defineProperty(this, 'sid', { get: function() { return sid; } });
  Object.defineProperty(this, 'remoteContext', { get: function() { return objects.deepClone(remoteContext); } });
  Object.defineProperty(this, 'localContext', { get: function() { return objects.deepClone(localContext); } });

  function mutableResolve() {
    return objects.deepMerge(localContext, remoteContext);
  }

  function ensureInitialized() {
    if (!initialized) {
      throw new Error('Evolv: The evolv context is not initialized')
    }
  }

  this.initialize = function(_uid, _sid, _remoteContext, _localContext) {
    if (initialized) {
      throw new Error('Evolv: The context is already initialized');
    }
    uid = _uid;
    sid = _sid;
    remoteContext = _remoteContext ? objects.deepClone(_remoteContext) : {};
    localContext = _localContext ? objects.deepClone(_localContext) : {};
    initialized = true;
    emit(this, CONTEXT_INITIALIZED, this.resolve());
  };

  this.destroy = function() {
    remoteContext = undefined;
    localContext = undefined;
    emit(this, CONTEXT_DESTROYED, this);
  };

  this.resolve = function() {
    ensureInitialized();
    return objects.deepClone(mutableResolve());
  };

  this.set = function(key, value, local) {
    ensureInitialized();
    const context = local ? localContext : remoteContext;
    const before = objects.getValueForKey(key, context);
    objects.setKeyToValue(key, value, context);

    const updated = this.resolve();
    if (typeof before === 'undefined') {
      emit(this, CONTEXT_VALUE_ADDED, key, value, local, updated);
    } else {
      emit(this, CONTEXT_VALUE_CHANGED, key, value, before, local, updated);
    }
    emit(this, CONTEXT_CHANGED, updated);
  };

  this.remove = function(key, local) {
    ensureInitialized();
    objects.removeValueForKey(key, localContext);
    objects.removeValueForKey(key, remoteContext);

    const updated = this.resolve();
    emit(this, CONTEXT_VALUE_REMOVED, key, local, updated);
    emit(this, CONTEXT_CHANGED, updated);
  };

  this.get = function(key) {
    ensureInitialized();
    return (remoteContext[key] || localContext[key]);
  };

  this.contains = function(key) {
    ensureInitialized();
    return key in remoteContext || key in localContext;
  };
}

export default EvolvContext;
