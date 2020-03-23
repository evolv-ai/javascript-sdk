import Context, {
  CONTEXT_INITIALIZED,
  CONTEXT_VALUE_ADDED,
  CONTEXT_VALUE_CHANGED,
  CONTEXT_VALUE_REMOVED
} from './context.js';

import Store from './store.js';
import { waitFor, waitOnceFor, emit, destroyScope } from './waitforit.js';
import Beacon from "./beacon.js";

export const INITIALIZED = 'initialized';

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

  Object.defineProperty(this, 'context', { get: function() { return context; } });

  this.on = waitFor.bind(undefined, context);
  this.once = waitOnceFor.bind(undefined, context);
  this.preload = store.preload.bind(store);
  this.get = store.get.bind(store);
  this.isActive = store.isActive.bind(store);
  this.getActiveKeys = store.getActiveKeys.bind(store);
  this.getConfig = store.getConfig.bind(store);
  this.subscribe = store.subscribe.bind(store);
  this.unsubscribe = store.unsubscribe.bind(store);
  this.emit = eventBeacon.emit.bind(eventBeacon);

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

    waitFor(context, CONTEXT_INITIALIZED, function(type, context) {
      contextBeacon.emit(type, context);
    });
    waitFor(context, CONTEXT_VALUE_ADDED, function(type, key, value) {
      contextBeacon.emit(type, {
        key: key,
        value: value
      });
    });
    waitFor(context, CONTEXT_VALUE_CHANGED, function(type, key, value) {
      contextBeacon.emit(type, {
        key: key,
        value: value
      });
    });
    waitFor(context, CONTEXT_VALUE_REMOVED, function(type, key) {
      contextBeacon.emit(type, {
        key: key
      });
    });
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
  }
}

export default EvolvClient;
