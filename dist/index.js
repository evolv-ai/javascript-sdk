/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded chunks
/******/ 	// "0" means "already loaded"
/******/ 	var installedChunks = {
/******/ 		"main": 0
/******/ 	};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// uncaught error handler for webpack runtime
/******/ 	__webpack_require__.oe = function(err) {
/******/ 		process.nextTick(function() {
/******/ 			throw err; // catch this error by using import().catch()
/******/ 		});
/******/ 	};
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/beacon.js":
/*!***********************!*\
  !*** ./src/beacon.js ***!
  \***********************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return Emitter; });
/* harmony import */ var _retrieve_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./retrieve.js */ "./src/retrieve.js");


const DELAY = 1;

function fallbackBeacon(url, data, sync) {
  Object(_retrieve_js__WEBPACK_IMPORTED_MODULE_0__["default"])({
    method: 'post',
    url: url,
    data: data,
    sync: sync
  })
    .catch(function(err) {
      console.log(err);
    });
  return true;
}

function Emitter(endpoint) {
  let messages = [];
  let timer;

  function send(url, data, sync) {
    if (typeof window !== 'undefined' && window.navigator.sendBeacon) {
      return window.navigator.sendBeacon(url, data);
    } else {
      return fallbackBeacon(url, data, sync);
    }
  }

  function transmit() {
    let sync = false;
    if (typeof this !== 'undefined') {
      const currentEvent = this.event && this.event.type;
      sync = currentEvent === 'unload' || currentEvent === 'beforeunload';
    }

    if (!messages.length) {
      return;
    }

    const batch = messages;
    messages = [];
    if (timer) {
      clearTimeout(timer);
    }
    timer = undefined;

    batch.forEach(function(message) {
      const endpointMatch = endpoint.match(new RegExp('\\/(v\\d+)\\/\\w+\\/([a-z]+)$'));
      if (endpointMatch[2] === 'analytics' && endpointMatch[1] === 'v1') {
        return;
      }

      let editedMessage = message
      if (endpointMatch[1] === 'v1') {
        // change needed to support v1 of the participants api
        editedMessage = message[1] || {};
        editedMessage.type = message[0];
      }

      if (!send(endpoint, JSON.stringify(editedMessage), sync)) {
        messages.push(message);
        console.error('Evolv: Unable to send beacon');
      }
    });

    if (messages.length) {
      timer = setTimeout(transmit, DELAY);
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('unload', transmit);
    window.addEventListener('beforeunload', transmit);
  }

  this.emit = function(type, data, flush=false) {
    messages.push([type, data]);
    if (flush) {
      transmit();
      return;
    }

    if (!timer) {
      timer = setTimeout(transmit, DELAY);
    }
  };

  this.flush = transmit;
}


/***/ }),

/***/ "./src/context.js":
/*!************************!*\
  !*** ./src/context.js ***!
  \************************/
/*! exports provided: CONTEXT_CHANGED, CONTEXT_INITIALIZED, CONTEXT_VALUE_REMOVED, CONTEXT_VALUE_ADDED, CONTEXT_VALUE_CHANGED, CONTEXT_DESTROYED, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CONTEXT_CHANGED", function() { return CONTEXT_CHANGED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CONTEXT_INITIALIZED", function() { return CONTEXT_INITIALIZED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CONTEXT_VALUE_REMOVED", function() { return CONTEXT_VALUE_REMOVED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CONTEXT_VALUE_ADDED", function() { return CONTEXT_VALUE_ADDED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CONTEXT_VALUE_CHANGED", function() { return CONTEXT_VALUE_CHANGED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CONTEXT_DESTROYED", function() { return CONTEXT_DESTROYED; });
/* harmony import */ var _ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ponyfills/objects.js */ "./src/ponyfills/objects.js");
/* harmony import */ var _waitforit_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./waitforit.js */ "./src/waitforit.js");



const CONTEXT_CHANGED = 'context.changed';
const CONTEXT_INITIALIZED = 'context.initialized';
const CONTEXT_VALUE_REMOVED = 'context.value.removed';
const CONTEXT_VALUE_ADDED = 'context.value.added';
const CONTEXT_VALUE_CHANGED = 'context.value.changed';
const CONTEXT_DESTROYED = 'context.destroyed';

/**
 * The EvolvContext provides functionality to manage data relating to the client state, or context in which the
 * variants will be applied.
 *
 * This data is used for determining which variables are active, and for general analytics.
 *
 * @constructor
 */
function EvolvContext() {
  let uid;
  let sid;
  let remoteContext;
  let localContext;
  let initialized = false;

  /**
   * A unique identifier for the participant.
   */
  Object.defineProperty(this, 'uid', { get: function() { return uid; } });

  /**
   * A unique identifier for the current session of the participant.
   */
  Object.defineProperty(this, 'sid', { get: function() { return sid; } });

  /**
   * The context information for evaluation of predicates and analytics.
   */
  Object.defineProperty(this, 'remoteContext', { get: function() { return _ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_0__["deepClone"](remoteContext); } });

  /**
   * The context information for evaluation of predicates only, and not used for analytics.
   */
  Object.defineProperty(this, 'localContext', { get: function() { return _ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_0__["deepClone"](localContext); } });

  function mutableResolve() {
    return _ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_0__["deepMerge"](localContext, remoteContext);
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
    remoteContext = _remoteContext ? _ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_0__["deepClone"](_remoteContext) : {};
    localContext = _localContext ? _ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_0__["deepClone"](_localContext) : {};
    initialized = true;
    Object(_waitforit_js__WEBPACK_IMPORTED_MODULE_1__["emit"])(this, CONTEXT_INITIALIZED, this.resolve());
  };

  this.destroy = function() {
    remoteContext = undefined;
    localContext = undefined;
    Object(_waitforit_js__WEBPACK_IMPORTED_MODULE_1__["emit"])(this, CONTEXT_DESTROYED, this);
  };

  /**
   * Computes the effective context from the local and remote contexts.
   *
   * @returns {Object} The effective context from the local and remote contexts.
   */
  this.resolve = function() {
    ensureInitialized();
    return _ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_0__["deepClone"](mutableResolve());
  };

  /**
   * Sets a value in the current context.
   *
   * This will cause the effective genome to be recomputed.
   *
   * @param key {String} The key to associate the value to.
   * @param value {*} The value to associate with the key.
   * @param local {Boolean} If true, the value will only be added to the localContext.
   */
  this.set = function(key, value, local) {
    ensureInitialized();
    const context = local ? localContext : remoteContext;
    const before = _ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_0__["getValueForKey"](key, context);
    _ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_0__["setKeyToValue"](key, value, context);

    const updated = this.resolve();
    if (typeof before === 'undefined') {
      Object(_waitforit_js__WEBPACK_IMPORTED_MODULE_1__["emit"])(this, CONTEXT_VALUE_ADDED, key, value, local, updated);
    } else {
      Object(_waitforit_js__WEBPACK_IMPORTED_MODULE_1__["emit"])(this, CONTEXT_VALUE_CHANGED, key, value, before, local, updated);
    }
    Object(_waitforit_js__WEBPACK_IMPORTED_MODULE_1__["emit"])(this, CONTEXT_CHANGED, updated);
  };

  /**
   * Remove a specified key from the context.
   *
   * This will cause the effective genome to be recomputed.
   *
   * @param key {String} The key to remove from the context.
   */
  this.remove = function(key) {
    ensureInitialized();
    const local = _ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_0__["removeValueForKey"](key, localContext);
    const remote = _ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_0__["removeValueForKey"](key, remoteContext);
    const removed = local || remote;

    if (removed) {
      const updated = this.resolve();
      Object(_waitforit_js__WEBPACK_IMPORTED_MODULE_1__["emit"])(this, CONTEXT_VALUE_REMOVED, key, !remote, updated);
      Object(_waitforit_js__WEBPACK_IMPORTED_MODULE_1__["emit"])(this, CONTEXT_CHANGED, updated);
    }

    return removed;
  };

  /**
   * Retrieve a value from the context.
   *
   * @param {String} key The kay associated with the value to retrieve.
   * @returns {*} The value associated with the specified key.
   */
  this.get = function(key) {
    ensureInitialized();
    return (remoteContext[key] || localContext[key]);
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
}

/* harmony default export */ __webpack_exports__["default"] = (EvolvContext);


/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _context_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./context.js */ "./src/context.js");
/* harmony import */ var _store_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./store.js */ "./src/store.js");
/* harmony import */ var _waitforit_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./waitforit.js */ "./src/waitforit.js");
/* harmony import */ var _beacon_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./beacon.js */ "./src/beacon.js");
/* harmony import */ var _ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./ponyfills/objects.js */ "./src/ponyfills/objects.js");







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

  if (!options.env) {
    throw new Error('"env" must be specified');
  }

  if (typeof options.autoConfirm === 'undefined') {
    options.autoConfirm = true;
  }

  options.endpoint = options.endpoint || 'https://participants.evolv.ai/';
  options.version = options.version || 1;

  const context = new _context_js__WEBPACK_IMPORTED_MODULE_0__["default"](options);
  const store = new _store_js__WEBPACK_IMPORTED_MODULE_1__["default"](options);
  const contextBeacon = new _beacon_js__WEBPACK_IMPORTED_MODULE_3__["default"](options.endpoint + '/' + options.env + '/analytics');
  const eventBeacon = new _beacon_js__WEBPACK_IMPORTED_MODULE_3__["default"](options.endpoint + '/' + options.env + '/events');

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
   * * CONTEXT_VALUE_REMOVED - Called when a value is removed from context with (topic, key, updated_context)
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
  this.on = _waitforit_js__WEBPACK_IMPORTED_MODULE_2__["waitFor"].bind(undefined, context);

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
  this.once = _waitforit_js__WEBPACK_IMPORTED_MODULE_2__["waitOnceFor"].bind(undefined, context);

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
   * @returns {SubscribablePromise.<Array.<String>|Error>} A SubscribablePromise that resolves to an array of keys when
   * the specified prefix.
   * @method
   */
  this.getActiveKeys = store.getActiveKeys.bind(store);

  /**
   * Get the configuration for a specified key.
   *
   * @param {String} key The key to retrieve the configuration for.
   * @returns {SubscribablePromise.<*|Error>} A SubscribablePromise that resolves to the configuration of the
   * specified key.
   * @method
   */
  this.getConfig = store.getConfig.bind(store);
  this.emit = function(type, score, flush) {
    eventBeacon.emit(type, Object(_ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_4__["assign"])({
      uid: context.uid,
      sid: context.sid,
      score: score
    }, context.remoteContext), flush);
    Object(_waitforit_js__WEBPACK_IMPORTED_MODULE_2__["emit"])(context, EvolvClient.EVENT_EMITTED, type, score);
  };

  /**
   * Confirm that the consumer has successfully received and applied values, making them eligible for inclusion in
   * optimization statistics.
   */
  this.confirm = function() {
    const remoteContext = context.remoteContext;
    if (
      !remoteContext.experiments ||
      !remoteContext.experiments.allocations || !remoteContext.experiments.allocations.length
    ) {
      return [];
    }

    remoteContext.experiments.allocations.forEach(function(alloc) {
      eventBeacon.emit('confirmation', Object(_ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_4__["assign"])({
        uid: alloc.uid,
        sid: alloc.sid,
        eid: alloc.eid,
        cid: alloc.cid
      }, context.remoteContext));
    });
    eventBeacon.flush();
    Object(_waitforit_js__WEBPACK_IMPORTED_MODULE_2__["emit"])(context, EvolvClient.CONFIRMED);
  };

  /**
   * Marks a consumer as unsuccessfully retrieving and / or applying requested values, making them ineligible for
   * inclusion in optimization statistics.
   */
  this.contaminate = function() {
    const remoteContext = context.remoteContext;
    if (
      !remoteContext.experiments ||
      !remoteContext.experiments.allocations || !remoteContext.experiments.allocations.length
    ) {
      return [];
    }

    remoteContext.experiments.allocations.forEach(function(alloc) {
      eventBeacon.emit('contamination', Object(_ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_4__["assign"])({
        uid: alloc.uid,
        sid: alloc.sid,
        eid: alloc.eid,
        cid: alloc.cid
      }, context.remoteContext));
    });
    eventBeacon.flush();
    Object(_waitforit_js__WEBPACK_IMPORTED_MODULE_2__["emit"])(context, EvolvClient.CONTAMINATED);
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

    Object(_waitforit_js__WEBPACK_IMPORTED_MODULE_2__["waitFor"])(context, _context_js__WEBPACK_IMPORTED_MODULE_0__["CONTEXT_INITIALIZED"], function(type, ctx) {
      contextBeacon.emit(type, context.remoteContext);
    });
    Object(_waitforit_js__WEBPACK_IMPORTED_MODULE_2__["waitFor"])(context, _context_js__WEBPACK_IMPORTED_MODULE_0__["CONTEXT_VALUE_ADDED"], function(type, key, value, local) {
      if (local) {
        return;
      }

      contextBeacon.emit(type, { key: key, value: value });
    });
    Object(_waitforit_js__WEBPACK_IMPORTED_MODULE_2__["waitFor"])(context, _context_js__WEBPACK_IMPORTED_MODULE_0__["CONTEXT_VALUE_CHANGED"], function(type, key, value, before, local) {
      if (local) {
        return;
      }

      contextBeacon.emit(type, { key: key, value: value });
    });
    Object(_waitforit_js__WEBPACK_IMPORTED_MODULE_2__["waitFor"])(context, _context_js__WEBPACK_IMPORTED_MODULE_0__["CONTEXT_VALUE_REMOVED"], function(type, key, local) {
      if (local) {
        return;
      }

      contextBeacon.emit(type, { key: key });
    });

    if (options.autoConfirm) {
      Object(_waitforit_js__WEBPACK_IMPORTED_MODULE_2__["waitFor"])(_store_js__WEBPACK_IMPORTED_MODULE_1__["EFFECTIVE_GENOME_UPDATED"], this.confirm.bind(this));
      Object(_waitforit_js__WEBPACK_IMPORTED_MODULE_2__["waitFor"])(_store_js__WEBPACK_IMPORTED_MODULE_1__["REQUEST_FAILED"], this.contaminate.bind(this));
    }

    initialized = true;
    Object(_waitforit_js__WEBPACK_IMPORTED_MODULE_2__["emit"])(context, EvolvClient.INITIALIZED, options);
  };

  /**
   * Force all beacons to transmit.
   */
  this.flush = function() {
    eventBeacon.flush();
    contextBeacon.flush();
  };

  /**
   * Destroy the client and its dependencies.
   */
  this.destroy = function () {
    this.flush();
    store.destroy();
    context.destroy();
    Object(_waitforit_js__WEBPACK_IMPORTED_MODULE_2__["destroyScope"])(context);
  };
}

EvolvClient.INITIALIZED = 'initialized';
EvolvClient.CONFIRMED = 'confirmed';
EvolvClient.CONTAMINATED = 'contaminated';
EvolvClient.EVENT_EMITTED = 'event.emitted';

/* harmony default export */ __webpack_exports__["default"] = (EvolvClient);


/***/ }),

/***/ "./src/ponyfills/base64.js":
/*!*********************************!*\
  !*** ./src/ponyfills/base64.js ***!
  \*********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var base64_arraybuffer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! base64-arraybuffer */ "base64-arraybuffer");
/* harmony import */ var base64_arraybuffer__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(base64_arraybuffer__WEBPACK_IMPORTED_MODULE_0__);


/* harmony default export */ __webpack_exports__["default"] = ({
  encode: function(bytes) {
    return typeof btoa !== 'undefined' ? btoa(bytes) : Buffer.from(bytes).toString('base64');
  },
  decode: function(string) {
    return typeof atob !== 'undefined' ? atob(string) : Buffer.from(string, 'base64').toString();
  },
  encodeFromArrayBuffer: base64_arraybuffer__WEBPACK_IMPORTED_MODULE_0___default.a.encode,
  decodeToArrayBuffer: base64_arraybuffer__WEBPACK_IMPORTED_MODULE_0___default.a.decode
});


/***/ }),

/***/ "./src/ponyfills/minipromise.js":
/*!**************************************!*\
  !*** ./src/ponyfills/minipromise.js ***!
  \**************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return MiniPromise; });
const invoker = function(args, fn) {
  fn.call(this, args);
};

class MiniPromise {
  constructor(executor) {
    this._responseArgs = null;
    this._errored = false;
    this._thens = [];
    this._catches = [];
    this._finallys = [];

    const response = function(errored, handlers) {
      if (this._responseArgs) {
        throw Error('Response already sent');
      }
      const args = Array.prototype.slice.call(arguments);
      // Drop the errored and handlers arguments from the binding
      args.shift();
      args.shift();
      this._errored = errored;
      this._responseArgs = arguments;
      this._catches.forEach(invoker.bind(this, arguments));
      this._finallys.forEach(invoker.bind(this, arguments));
    };

    const reject = response.bind(this, true, this._catches);
    const resolve = response.bind(this, false, this._thens);

    try {
      executor(resolve, reject);
    } catch (err) {
      reject(err);
    }
  }

  then(handler) {
    if (this._responseArgs && !this._errored) {
      invoker.call(this, this._responseArgs, handler);
      return;
    }

    this._thens.push(handler);
  }

  catch(handler) {
    if (this._responseArgs && this._errored) {
      invoker.call(this, this._responseArgs, handler);
      return;
    }

    this._catches.push(handler);
  }

  finally(handler) {
    if (this._responseArgs) {
      invoker.call(this, this._responseArgs, handler);
      return;
    }

    this._finallys.push(handler);
  }
}

MiniPromise.createPromise = function (executor) {
  return new (typeof Promise !== 'undefined' ? Promise : MiniPromise)(executor);
};


/***/ }),

/***/ "./src/ponyfills/objects.js":
/*!**********************************!*\
  !*** ./src/ponyfills/objects.js ***!
  \**********************************/
/*! exports provided: deepMerge, deepClone, isObject, flatten, flattenKeys, removeValueForKey, getValueForKey, setKeyToValue, expand, filter, assign */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "deepMerge", function() { return deepMerge; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "deepClone", function() { return deepClone; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isObject", function() { return isObject; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "flatten", function() { return flatten; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "flattenKeys", function() { return flattenKeys; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "removeValueForKey", function() { return removeValueForKey; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getValueForKey", function() { return getValueForKey; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setKeyToValue", function() { return setKeyToValue; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "expand", function() { return expand; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "filter", function() { return filter; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "assign", function() { return assign; });
/* harmony import */ var deepmerge__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! deepmerge */ "deepmerge");
/* harmony import */ var deepmerge__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(deepmerge__WEBPACK_IMPORTED_MODULE_0__);


const deepMerge = deepmerge__WEBPACK_IMPORTED_MODULE_0___default.a;
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if a variable is an Object. This function considers Null and Array to not be Objects.
 *
 * @param variable The variable that is to tested
 * @returns {boolean} True if the variable is an object
 */
function isObject(variable) {
  return typeof variable === 'object' && variable !== null && !Array.isArray(variable);
}

/**
 * Convert a hierarchical map into a flattened map
 *
 * @param {Object} map A map with hierarchical keys
 * @returns {Object} A map with hierarchical keys flattened
 */
function flatten(map, filter) {
  function recurse(current, parent_key) {
    let items = {};
    Object.keys(current).filter(filter || function() { return true; }).forEach(function(k) {
      let v = current[k];
      let new_key = parent_key ? (parent_key + '.' + k) : k;
      if (isObject(v)) {
        items = assign(items, recurse(current[k], new_key));
      } else {
        items[new_key] = v;
      }
    });

    return items;
  }

  return recurse(map, '');
}

function flattenKeys(map, filter) {
  function recurse(current, parent_key) {
    let items = [];
    Object.keys(current).filter(filter || function() { return true; }).forEach(function(k) {
      let v = current[k];
      let new_key = parent_key ? (parent_key + '.' + k) : k;
      items.push(new_key);
      if (isObject(v)) {
        items = items.concat(recurse(current[k], new_key));
      }
    });

    return items;
  }

  return recurse(map, '');
}

function removeValueForKey(key, map) {
  function recurse(keys, index, map) {
    let key = keys[index];
    if (index === (keys.length - 1)) {
      delete map[key];
      return true;
    }

    if (!(key in map)) {
      return false;
    }

    if (recurse(keys, index + 1, map[key]) && Object.keys(map[key]).length === 0) {
      delete map[key];
      return true;
    }
  }

  return recurse(key.split('.'), 0, map);
}

function getValueForKey(key, map) {
  let value;
  let current = map;
  let keys = key.split('.');
  for (let i = 0; i < keys.length; i++) {
    let k = keys[i];
    if (i === (keys.length - 1)) {
      value = current[k];
      break;
    }

    if (!(k in current)) {
      break;
    }

    current = current[k];
  }

  return value;
}

function setKeyToValue(key, value, map) {
  let current = map;
  let keys = key.split('.');
  for (let i = 0; i < keys.length; i++) {
    let k = keys[i];
    if (i === (keys.length - 1)) {
      current[k] = value;
      break;
    }

    if (!(k in current)) {
      current[k] = {};
    }

    current = current[k];
  }

  return value;
}

/**
 * Convert a flattened map into a hierarchical map
 *
 * @param {Object} map A map with hierarchical keys flattened
 * @returns {Object} A map with hierarchical keys
 */
function expand(map) {
  let expanded = {};
  Object.keys(map).forEach(function(key) {
    let v = map[key];
    setKeyToValue(key, v, expanded);
  });

  return expanded;
}

function filter(map, active) {
  const flattened = flatten(map);
  const filtered = {};
  active.forEach(function(key) {
    if (key in flattened) {
      filtered[key] = flattened[key];
    }
  });

  return expand(filtered);
}

function assign(target, sources) {
  if (Object.assign) {
    return Object.assign.apply(undefined, arguments);
  }

  if (target === null || target === undefined) {
    throw new TypeError('Cannot convert undefined or null to object');
  }

  const to = Object(target);

  for (let index = 1; index < arguments.length; index++) {
    let nextSource = arguments[index];

    if (nextSource !== null && nextSource !== undefined) {
      for (let nextKey in nextSource) {
        // Avoid bugs when hasOwnProperty is shadowed
        if (nextSource.hasOwnProperty(nextKey)) {
          to[nextKey] = nextSource[nextKey];
        }
      }
    }
  }

  return to;
}


/***/ }),

/***/ "./src/predicates.js":
/*!***************************!*\
  !*** ./src/predicates.js ***!
  \***************************/
/*! exports provided: evaluate */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "evaluate", function() { return evaluate; });
/* harmony import */ var _ponyfills_base64_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ponyfills/base64.js */ "./src/ponyfills/base64.js");


const AND = 'and';
const OR = 'or';

const FILTER_OPERATORS = {
  contains: function(a, b) { return a.indexOf(b) >= 0; },
  equal: function(a, b) { return a === b; },
  exists: function(a) { return a !== null; }, // Check that the key exists in the dictionary object
  not_contains: function(a, b) { return !(a.indexOf(b) >= 0); },
  not_equal: function(a, b) { return a !== b; },
  not_regex_match: function(value, pattern) { return value && !value.match(pattern); },
  not_regex64_match: function(value, pattern) { return !regex64Match(value, pattern) },
  not_starts_with: function(a, b) { return !a.startsWith(b); },
  kv_contains: function(obj, params) { return (params[0] in obj) && (obj[params[0]].indexOf(params[1]) >= 0) },
  kv_equal: function(obj, params) { return obj[params[0]] === params[1]; },
  kv_not_contains: function(obj, params) { return !((params[0] in obj) && (obj[params[0]].indexOf(params[1]) >= 0)); },
  kv_not_equal: function(obj, params) { return obj[params[0]] !== params[1]; },
  regex_match: function(value, pattern) { return value && value.match(pattern); },
  regex64_match: regex64Match,
  starts_with: function(a, b){ return a.startsWith(b); }
};

function regexFromString (string) {
  if (!string.startsWith('/')) {
    return new RegExp(string);
  }

  const split = string.lastIndexOf('/');
  return new RegExp(string.substring(1, split), string.substring(split + 1));
}

function regex64Match(value, b64pattern) {
  try {
    const string = _ponyfills_base64_js__WEBPACK_IMPORTED_MODULE_0__["default"].decode(b64pattern);
    return value && value.match(regexFromString(string)) !== null;
  } catch (e) {
    return false;
  }
}

function valueFromKey(context, key) {
  if (context === undefined) {
    return undefined;
  }

  const nextToken = key.indexOf('.');
  if (nextToken === 0) {
    throw new Error('Invalid variant key: ' + key);
  }

  if (nextToken === -1) {
    return key in context ? context[key] : undefined;
  }

  return valueFromKey(context[key.substring(0, nextToken)], key.substring(nextToken + 1));
}

function evaluateFilter(user, rule) {
  const value = valueFromKey(user, rule.field);

  if (rule.operator.startsWith('kv_') && !value) {
    return false;
  }

  // Evaluates a single filter rule against a user.
  return !!FILTER_OPERATORS[rule.operator](value, rule.value);
}


function evaluateRule(user, query, rule, passedRules, failedRules) {
  let result;
  if ('combinator' in rule) {
    // No need to add groups to pass/failed rule sets here. Their children results will be merged up
    // via recursion.
    // eslint-disable-next-line no-use-before-define
    return evaluatePredicate(user, rule, passedRules, failedRules);
  } else {
    result = evaluateFilter(user, rule);
  }

  // Any other rule is also a terminating branch in our recursion tree, so we add rule id to pass/fail rule set
  (result ? passedRules : failedRules).add({
    id: query.id,
    index: rule.index,
    field: rule.field
  });

  return result;
}


function evaluatePredicate(user, query, passedRules, failedRules) {
  const { rules } = query;

  if (!rules) {
    return true;
  }

  for (let i = 0; i < rules.length; i++) {
    const passed = evaluateRule(user, query, rules[i], passedRules, failedRules);
    if (passed && query.combinator === OR) {
      return true;
    }

    if (!passed && query.combinator === AND) {
      return false;
    }
  }

  // If we've reached this point on an 'or' all rules failed.
  return query.combinator === AND;
}


/**
Evaluates a query against a user object and saves passing/failing rule ids to provided sets.

  @param context A context object containing describing the context the predicate should be evaluated against.
  @param predicate Nested predicate object that rules structured into groups as a deeply nested tree.
               note: There is no set limit to the depth of this tree, hence we must work with it
               using recursion.
*/
function evaluate(context, predicate) {
  const result = {
    passed: new Set(),
    failed: new Set()
  };

  result.rejected = !evaluatePredicate(context, predicate, result.passed, result.failed);

  return result;
}


/***/ }),

/***/ "./src/retrieve.js":
/*!*************************!*\
  !*** ./src/retrieve.js ***!
  \*************************/
/*! exports provided: str2ab, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "str2ab", function() { return str2ab; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return retrieve; });
/* harmony import */ var _ponyfills_minipromise_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ponyfills/minipromise.js */ "./src/ponyfills/minipromise.js");
/* harmony import */ var _ponyfills_base64_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ponyfills/base64.js */ "./src/ponyfills/base64.js");
/* harmony import */ var _ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./ponyfills/objects.js */ "./src/ponyfills/objects.js");




const URL_PATTERN = /^([a-z]+):\/\/([^/]+)(.*)/i;

function cryptography() {
  return typeof crypto !== 'undefined' ? crypto : msCrypto;
}

/**
 * Convert a String to an ArrayBuffer
 *
 * ie11 Supported
 *
 * @param str The String to convert to an ArrayBuffer
 * @returns {ArrayBuffer} The resulting array buffer encoded as utf-8
 */
function str2ab(str) {
  if (typeof TextEncoder !== 'undefined') {
    return (new TextEncoder()).encode(str).buffer;
  }

  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

/**
 * Converts an msCrypto operation to a promise if needed.
 *
 * @param op The op (or Promise) to convert if needed.
 * @returns {{PromiseLike} A promise
 */
function cryptoOperationToPromise(op) {
  if (op.then) {
    return op;
  }

  return _ponyfills_minipromise_js__WEBPACK_IMPORTED_MODULE_0__["default"].createPromise(function(resolve, reject) {
    op.oncomplete = function(evt) {
      resolve(evt.target.result);
    };

    function rejectHandler(evt) {
      reject(evt.toString());
    }
    op.onerror = rejectHandler;
    op.onabort = rejectHandler;
  });
}

/**
 * Sign a String with HMAC-SHA384
 *
 * @param {String} key The HMAC key to use for signing
 * @param {String} payload The String to sign
 * @returns {PromiseLike<ArrayBuffer>} The cryptographic signature
 */
function sign(key, payload) {
  const keyFormat = 'raw';
  const algorithm = { name: 'HMAC', hash: 'SHA-384' };
  const keyUsages = ['sign'];
  const crypto = cryptography();

  return _ponyfills_minipromise_js__WEBPACK_IMPORTED_MODULE_0__["default"].createPromise(function(resolve, reject) {
    cryptoOperationToPromise(crypto.subtle.importKey(keyFormat, str2ab(key), algorithm, true, keyUsages))
      .then(function (cryptoKey) {
        cryptoOperationToPromise(crypto.subtle.sign(algorithm, cryptoKey, payload))
          .then(function(bytes) {
            resolve(_ponyfills_base64_js__WEBPACK_IMPORTED_MODULE_1__["default"].encodeFromArrayBuffer(bytes));
          })
          .catch(reject);
      })
      .catch(reject);
  });
}

function createSignatureHeader(signatureKeyId, signature) {
  return 'keyId="' + signatureKeyId + '",algorithm="hmac-sha384",signature="' + signature + '"';
}

function xhrRequest(options) {
  return _ponyfills_minipromise_js__WEBPACK_IMPORTED_MODULE_0__["default"].createPromise(function(resolve, reject) {
    const xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function () {
      if (this.status >= 400) {
        reject(this.statusText || ('Evolv: Request failed ' + this.status));
        return;
      }

      if (this.status === 200) {
        resolve(JSON.parse(this.responseText));
      } else if (this.status === 202) {
        resolve();
      } else {
        console.error('Evolv: Invalid status ' + this.status + ' for response ' + this.responseText);
        reject(msg);
      }
    });
    xhr.addEventListener('error', reject);
    xhr.open(options.method, options.url, options.sync);
    xhr.setRequestHeader('Accept', 'application/json');
    if (options.signature) {
      xhr.setRequestHeader('Signature', createSignatureHeader(options.keyId, options.signature));
    }
    xhr.send(options.payload);
  });
}

function nodeRequest(options) {
  return _ponyfills_minipromise_js__WEBPACK_IMPORTED_MODULE_0__["default"].createPromise(function(resolve, reject) {
    const parts = URL_PATTERN.exec(options.url);
    if (!parts) {
      throw new Error('Evolv: Invalid endpoint URL');
    }

    const schema = parts[1];
    (schema === 'http' ? Promise.resolve(/*! import() */).then(__webpack_require__.t.bind(null, /*! http */ "http", 7)) : Promise.resolve(/*! import() */).then(__webpack_require__.t.bind(null, /*! https */ "https", 7))).then(function (http) {
      const hostname = parts[2];
      const path = parts[3];
      const headers = {
        'Content-Type': 'application/json;charset=UTF-8',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(options.payload)
      };

      if (options.signature) {
        headers['Signature'] = createSignatureHeader(options.keyId, options.signature);
      }
      const req = http.request({
        hostname: hostname,
        path: path,
        method: options.method,
        headers: headers
      }, function (res) {
        res.on('data', resolve);
      });
      req.on('error', reject);
      req.write(options.payload);
      req.end();
    });
  });
}

function retrieve(options) {
  return _ponyfills_minipromise_js__WEBPACK_IMPORTED_MODULE_0__["default"].createPromise(function(resolve, reject) {
    let payload;
    if (!options.data) {
      payload = '';
    } else if (typeof options.data === 'object') {
      payload = JSON.stringify(options.data);
    } else {
      payload = options.data;
    }
    options = Object(_ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_2__["assign"])({ payload:  payload }, options);

    let rx;
    if (typeof XMLHttpRequest !== 'undefined') {
      rx = xhrRequest;
    } else {
      rx = nodeRequest;
    }

    if (!options.key) {
      rx(options)
        .then(resolve)
        .catch(reject);
      return;
    }

    sign(options.key, str2ab(options.payload))
      .then(function (signature) {
        rx(Object(_ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_2__["assign"])({signature:signature}, options))
          .then(resolve)
          .catch(reject);
      })
      .catch(reject);
  });
}


/***/ }),

/***/ "./src/store.js":
/*!**********************!*\
  !*** ./src/store.js ***!
  \**********************/
/*! exports provided: GENOME_REQUEST_SENT, CONFIG_REQUEST_SENT, GENOME_REQUEST_RECEIVED, CONFIG_REQUEST_RECEIVED, REQUEST_FAILED, GENOME_UPDATED, CONFIG_UPDATED, EFFECTIVE_GENOME_UPDATED, STORE_DESTROYED, evaluatePredicates, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GENOME_REQUEST_SENT", function() { return GENOME_REQUEST_SENT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CONFIG_REQUEST_SENT", function() { return CONFIG_REQUEST_SENT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GENOME_REQUEST_RECEIVED", function() { return GENOME_REQUEST_RECEIVED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CONFIG_REQUEST_RECEIVED", function() { return CONFIG_REQUEST_RECEIVED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "REQUEST_FAILED", function() { return REQUEST_FAILED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GENOME_UPDATED", function() { return GENOME_UPDATED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CONFIG_UPDATED", function() { return CONFIG_UPDATED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "EFFECTIVE_GENOME_UPDATED", function() { return EFFECTIVE_GENOME_UPDATED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "STORE_DESTROYED", function() { return STORE_DESTROYED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "evaluatePredicates", function() { return evaluatePredicates; });
/* harmony import */ var _ponyfills_minipromise_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ponyfills/minipromise.js */ "./src/ponyfills/minipromise.js");
/* harmony import */ var _ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ponyfills/objects.js */ "./src/ponyfills/objects.js");
/* harmony import */ var _predicates_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./predicates.js */ "./src/predicates.js");
/* harmony import */ var _waitforit_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./waitforit.js */ "./src/waitforit.js");
/* harmony import */ var _context_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./context.js */ "./src/context.js");
/* harmony import */ var _retrieve_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./retrieve.js */ "./src/retrieve.js");








const CONFIG_SOURCE = 'config';
const GENOME_SOURCE = 'genome';

const GENOME_REQUEST_SENT = 'genome.request.sent';
const CONFIG_REQUEST_SENT = 'config.request.sent';
const GENOME_REQUEST_RECEIVED = 'genome.request.received';
const CONFIG_REQUEST_RECEIVED = 'config.request.received';
const REQUEST_FAILED = 'request.failed';
const GENOME_UPDATED = 'genome.updated';
const CONFIG_UPDATED = 'config.updated';
const EFFECTIVE_GENOME_UPDATED = 'effective.genome.updated';
const STORE_DESTROYED = 'store.destroyed';

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
  return _ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_1__["getValueForKey"](key, genome);
}

function getConfigValue(key, genome, config) {
  return _ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_1__["getValueForKey"](key, config);
}

function getValueActive(activeKeys, key) {
  return activeKeys.has(key);
}

function getActiveKeys(activeKeys, prefix) {
  const result = [];
  activeKeys.forEach(function(key) {
    if (!prefix || key.startsWith(prefix)) {
      result.push(key);
    }
  });

  return result;
}

// Exposed for testing
function evaluatePredicates(version, context, config) {
  if (!config._experiments || !config._experiments.length) {
    return {};
  }

  function evaluateBranch(context, config, prefix, disabled, entry) {
    if (config._predicate) {
      const result = Object(_predicates_js__WEBPACK_IMPORTED_MODULE_2__["evaluate"])(context, config._predicate);
      if (result.rejected) {
        disabled.push(prefix);
        return;
      }
    }

    if (config._is_entry_point) {
      entry.push(prefix);
    }

    Object.keys(config).forEach(function (key) {
      if (key.startsWith('_')) {
        return;
      }

      evaluateBranch(context, config[key], prefix ? prefix + '.' + key : key, disabled, entry);
    });
  }

  const evaluableContext = context.resolve();

  const result = {};
  config._experiments.forEach(function(exp) {
    const evaluableConfig = _ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_1__["assign"]({}, exp);
    delete evaluableConfig.id;
    const results = {
      disabled: [],
      entry: []
    };

    evaluateBranch(evaluableContext, evaluableConfig, '', results.disabled, results.entry);
    result[exp.id] = results;
  });

  return result;
}

function EvolvStore(options) {
  const prefix = options.endpoint + '/' + options.env;
  const keyId = options.auth && options.auth.id;
  const key = options.auth && options.auth.secret;
  const version = options.version || 1;

  let context;
  let initialized = false;
  let waitingToPull = false;
  let waitingToPullImmediate = true;
  let contaminated = false;
  let genomes = {};
  let effectiveGenome = {};
  let allocations = null;
  let config = null;
  let genomeFailed = false;
  let configFailed = false;
  const genomeKeyStates = {
    needed: new Set(),
    requested: new Set(),
    loaded: new Set()
  };

  const configKeyStates = {
    entry: new Set(),
    active: new Set(),
    needed: new Set(),
    requested: new Set(),
    loaded: new Set()
  };

  let outstandingValuePromises = [];
  let outstandingConfigPromises = [];
  let subscriptions = new Set();

  this.destroy = function() {
    genomes = undefined;
    effectiveGenome = undefined;
    allocations = undefined;
    config = undefined;

    delete genomeKeyStates.needed;
    delete genomeKeyStates.requested;
    delete genomeKeyStates.loaded;

    delete configKeyStates.entry;
    delete configKeyStates.active;
    delete configKeyStates.needed;
    delete configKeyStates.requested;
    delete configKeyStates.loaded;
    outstandingValuePromises.forEach(function(p) {
      p.reject();
    });
    outstandingValuePromises = undefined;
    outstandingConfigPromises.forEach(function(p) {
      p.reject();
    });
    outstandingConfigPromises = undefined;
    subscriptions = undefined;
    Object(_waitforit_js__WEBPACK_IMPORTED_MODULE_3__["emit"])(context, STORE_DESTROYED, this);
    context = undefined;
  };

  function reevaluateContext() {
    if (!config) {
      return;
    }

    const results = evaluatePredicates(version, context, config);
    configKeyStates.active.clear();
    configKeyStates.entry.clear();
    effectiveGenome = {};
    Object.keys(results).forEach(function(eid) {
      const result = results[eid];
      genomeKeyStates.loaded.forEach(function(key) {
        const active = !result.disabled.some(function(disabledKey) {
          return key.startsWith(disabledKey);
        });

        if (active) {
          configKeyStates.active.add(key);
          const entry = result.entry.some(function(entryKey) {
            return key.startsWith(entryKey);
          });

          if (entry) {
            configKeyStates.entry.add(key);
          }
        }
      });

      if (eid in genomes) {
        effectiveGenome = _ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_1__["deepMerge"](effectiveGenome, _ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_1__["filter"](genomes[eid], configKeyStates.active));
      }
    });

    Object(_waitforit_js__WEBPACK_IMPORTED_MODULE_3__["emit"])(context, EFFECTIVE_GENOME_UPDATED, effectiveGenome);
    subscriptions.forEach(function(listener) {
      try {
        listener(effectiveGenome, config);
      } catch (ex) {
        console.error(ex);
      }
    });
  }

  function updateGenome(value) {
    const allocs = [];
    const exclusions = [];
    allocations = value;
    genomeFailed = false;
    value.forEach(function(alloc) {
      const clean = _ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_1__["assign"]({}, alloc);
      delete clean.genome;
      delete clean.audience_query;

      allocs.push(clean);
      if (clean.excluded) {
        exclusions.push(clean.eid);
        return;
      }

      genomes[clean.eid] = alloc.genome;
      _ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_1__["flattenKeys"](alloc.genome, function(key) {
        return !key.startsWith('_');
      }).forEach(genomeKeyStates.loaded.add.bind(genomeKeyStates.loaded));
    });
    context.set('experiments.allocations', allocs);
    context.set('experiments.exclusions', exclusions);
  }

  function updateConfig(value) {
    config = value;
    configFailed = false;
    value._experiments.forEach(function(exp) {
      const clean = _ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_1__["assign"]({}, exp);
      delete clean.id;
      _ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_1__["flattenKeys"](clean, function(key) {
        return !key.startsWith('_');
      }).forEach(configKeyStates.loaded.add.bind(configKeyStates.loaded));
    });
  }


  function update(configRequest, requestedKeys, value) {
    let keyStates = configRequest ? configKeyStates : genomeKeyStates;

    requestedKeys.forEach(keyStates.requested.delete.bind(keyStates.requested));
    if (configRequest) {
      Object(_waitforit_js__WEBPACK_IMPORTED_MODULE_3__["emit"])(context, CONFIG_REQUEST_RECEIVED, requestedKeys);
      updateConfig(value);
    } else {
      Object(_waitforit_js__WEBPACK_IMPORTED_MODULE_3__["emit"])(context, GENOME_REQUEST_RECEIVED, requestedKeys);
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
          if (promise.key.startsWith(prefix)) {
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

    Object(_waitforit_js__WEBPACK_IMPORTED_MODULE_3__["emit"])(context,configRequest ? CONFIG_UPDATED : GENOME_UPDATED, value);
  }

  function failed(configRequest, requestedKeys, err) {
    contaminated = true;
    console.log(err);
    let keyStates;
    Object(_waitforit_js__WEBPACK_IMPORTED_MODULE_3__["emit"])(context, REQUEST_FAILED, configRequest ? CONFIG_SOURCE : GENOME_SOURCE, requestedKeys, err);
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
      Object(_retrieve_js__WEBPACK_IMPORTED_MODULE_5__["default"])({
        method: 'get',
        url: prefix + '/configuration.json',
        keyId: keyId,
        key: key
      })
        .then(update.bind(this, true, requestedKeys))
        .catch(failed.bind(this, true, requestedKeys));
      moveKeys(requestedKeys, configKeyStates.needed, configKeyStates.requested);
      Object(_waitforit_js__WEBPACK_IMPORTED_MODULE_3__["emit"])(context, CONFIG_REQUEST_SENT, requestedKeys);
    }

    if (genomeKeyStates.needed.size || version === 1) {
      const requestedKeys = [];
      genomeKeyStates.needed.forEach(requestedKeys.push.bind(requestedKeys));
      genomeKeyStates.needed.clear();
      Object(_retrieve_js__WEBPACK_IMPORTED_MODULE_5__["default"])({
        method: 'post',
        url: prefix + '/allocations',
        keyId: keyId,
        key: key,
        data: {uid: context.uid, sid: context.uid}
      })
        .then(update.bind(this, false, requestedKeys))
        .catch(failed.bind(this, false, requestedKeys));
      moveKeys(requestedKeys, genomeKeyStates.needed, genomeKeyStates.requested);
      Object(_waitforit_js__WEBPACK_IMPORTED_MODULE_3__["emit"])(context, GENOME_REQUEST_SENT, requestedKeys);
    }

    waitingToPull = false;
  }

  function createRequestSubscribablePromise(source, transform, key) {
    let resolve = null;
    let reject = null;
    const promise = _ponyfills_minipromise_js__WEBPACK_IMPORTED_MODULE_0__["default"].createPromise(function(res, rej) {
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
        if (!key || key.startsWith(prefix)) {
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
        allocations: _ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_1__["deepClone"](allocations),
        config: _ponyfills_objects_js__WEBPACK_IMPORTED_MODULE_1__["deepClone"](config)
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
    Object(_waitforit_js__WEBPACK_IMPORTED_MODULE_3__["waitFor"])(context, _context_js__WEBPACK_IMPORTED_MODULE_4__["CONTEXT_CHANGED"], reevaluateContext);
  };

  this.subscribe = subscriptions.add.bind(subscriptions);
  this.unsubscribe = subscriptions.delete.bind(subscriptions);

  this.get = createRequestSubscribablePromise.bind(this, GENOME_SOURCE, getValue.bind(this));
  this.getConfig = createRequestSubscribablePromise.bind(this, CONFIG_SOURCE, getConfigValue.bind(this));
  this.isActive = createRequestSubscribablePromise.bind(
    this, CONFIG_SOURCE, getValueActive.bind(this, configKeyStates.active));
  this.getActiveKeys = createRequestSubscribablePromise.bind(
    this, CONFIG_SOURCE, getActiveKeys.bind(this, configKeyStates.active));
}

/* harmony default export */ __webpack_exports__["default"] = (EvolvStore);


/***/ }),

/***/ "./src/waitforit.js":
/*!**************************!*\
  !*** ./src/waitforit.js ***!
  \**************************/
/*! exports provided: destroyScope, waitFor, waitOnceFor, emit */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "destroyScope", function() { return destroyScope; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "waitFor", function() { return waitFor; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "waitOnceFor", function() { return waitOnceFor; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "emit", function() { return emit; });
const scopedHandlers = new Map();
const scopedOnceHandlers = new Map();
const scopedPayloads = new Map();

function ensureScope(scope) {
  if (scopedHandlers.has(scope)) {
    return;
  }

  scopedHandlers.set(scope, {});
  scopedOnceHandlers.set(scope, {});
  scopedPayloads.set(scope, {});
}

function destroyScope(scope) {
  scopedHandlers.delete(scope);
  scopedOnceHandlers.delete(scope);
  scopedPayloads.delete(scope);
}

function waitFor(scope, it, handler) {
  ensureScope(scope);

  const handlers = scopedHandlers.get(scope);
  const payloads = scopedPayloads.get(scope);

  if (!handlers[it]) {
    handlers[it] = [handler];
  } else {
    handlers[it].push(handler);
  }

  if (payloads[it]) {
    handler.apply(undefined, payloads[it]);
  }
}

function waitOnceFor(scope, it, handler) {
  ensureScope(scope);

  const onceHandlers = scopedOnceHandlers.get(scope);
  const payloads = scopedPayloads.get(scope);

  if (payloads[it]) {
    handler.apply(undefined, payloads[it]);
    return;
  }

  if (!onceHandlers[it]) {
    onceHandlers[it] = [handler];
  } else {
    onceHandlers.push(handler);
  }
}

function emit(scope, it) {
  ensureScope(scope);

  const handlers = scopedHandlers.get(scope);
  const onceHandlers = scopedOnceHandlers.get(scope);
  const payloads = scopedPayloads.get(scope);

  const payload = [].slice.call(arguments);
  payload.shift();
  payloads[it] = payload;

  const oh = onceHandlers[it];
  while (oh && oh.length) {
    let handler = oh.shift();
    try {
      handler.apply(undefined, payload);
    } catch (err) {
      console.error(err);
      console.log('Failed to invoke one time handler of %s', it);
    }
  }

  const handlersForIt = handlers[it];
  if (!handlersForIt) {
    return;
  }
  handlersForIt.forEach(function(h) {
    try {
      h.apply(undefined, payload);
    } catch (err) {
      console.error(err);
      console.log('Failed to invoke handler of %s', it);
    }
  });
}


/***/ }),

/***/ "base64-arraybuffer":
/*!*************************************!*\
  !*** external "base64-arraybuffer" ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = base64-arraybuffer;

/***/ }),

/***/ "deepmerge":
/*!****************************!*\
  !*** external "deepmerge" ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = deepmerge;

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = http;

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = https;

/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vc3JjL2JlYWNvbi5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvY29udGV4dC5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3BvbnlmaWxscy9iYXNlNjQuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3BvbnlmaWxscy9taW5pcHJvbWlzZS5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvcG9ueWZpbGxzL29iamVjdHMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3ByZWRpY2F0ZXMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3JldHJpZXZlLmpzIiwid2VicGFjazovLy8uL3NyYy9zdG9yZS5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvd2FpdGZvcml0LmpzIiwid2VicGFjazovLy9leHRlcm5hbCBcImJhc2U2NC1hcnJheWJ1ZmZlclwiIiwid2VicGFjazovLy9leHRlcm5hbCBcImRlZXBtZXJnZVwiIiwid2VicGFjazovLy9leHRlcm5hbCBcImh0dHBcIiIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwgXCJodHRwc1wiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7UUFBQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBOzs7UUFHQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0EsMENBQTBDLGdDQUFnQztRQUMxRTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBLHdEQUF3RCxrQkFBa0I7UUFDMUU7UUFDQSxpREFBaUQsY0FBYztRQUMvRDs7UUFFQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0EseUNBQXlDLGlDQUFpQztRQUMxRSxnSEFBZ0gsbUJBQW1CLEVBQUU7UUFDckk7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQSwyQkFBMkIsMEJBQTBCLEVBQUU7UUFDdkQsaUNBQWlDLGVBQWU7UUFDaEQ7UUFDQTtRQUNBOztRQUVBO1FBQ0Esc0RBQXNELCtEQUErRDs7UUFFckg7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQSxjQUFjO1FBQ2QsSUFBSTtRQUNKOzs7UUFHQTtRQUNBOzs7Ozs7Ozs7Ozs7O0FDL0ZBO0FBQUE7QUFBQTtBQUFxQzs7QUFFckM7O0FBRUE7QUFDQSxFQUFFLDREQUFRO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBOztBQUVlO0FBQ2Y7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7QUFFTDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7Ozs7Ozs7OztBQ3pGQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBa0Q7QUFDWjs7QUFFL0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0Esc0NBQXNDLGtCQUFrQixZQUFZLEVBQUUsRUFBRTs7QUFFeEU7QUFDQTtBQUNBO0FBQ0Esc0NBQXNDLGtCQUFrQixZQUFZLEVBQUUsRUFBRTs7QUFFeEU7QUFDQTtBQUNBO0FBQ0EsZ0RBQWdELGtCQUFrQixRQUFRLCtEQUFpQixnQkFBZ0IsRUFBRSxFQUFFOztBQUUvRztBQUNBO0FBQ0E7QUFDQSwrQ0FBK0Msa0JBQWtCLFFBQVEsK0RBQWlCLGVBQWUsRUFBRSxFQUFFOztBQUU3RztBQUNBLFdBQVcsK0RBQWlCO0FBQzVCOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUNBQXFDLCtEQUFpQjtBQUN0RCxtQ0FBbUMsK0RBQWlCO0FBQ3BEO0FBQ0EsSUFBSSwwREFBSTtBQUNSOztBQUVBO0FBQ0E7QUFDQTtBQUNBLElBQUksMERBQUk7QUFDUjs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxlQUFlLE9BQU87QUFDdEI7QUFDQTtBQUNBO0FBQ0EsV0FBVywrREFBaUI7QUFDNUI7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQixPQUFPO0FBQ3hCLG1CQUFtQixFQUFFO0FBQ3JCLG1CQUFtQixRQUFRO0FBQzNCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLG9FQUFzQjtBQUN6QyxJQUFJLG1FQUFxQjs7QUFFekI7QUFDQTtBQUNBLE1BQU0sMERBQUk7QUFDVixLQUFLO0FBQ0wsTUFBTSwwREFBSTtBQUNWO0FBQ0EsSUFBSSwwREFBSTtBQUNSOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUIsT0FBTztBQUN4QjtBQUNBO0FBQ0E7QUFDQSxrQkFBa0IsdUVBQXlCO0FBQzNDLG1CQUFtQix1RUFBeUI7QUFDNUM7O0FBRUE7QUFDQTtBQUNBLE1BQU0sMERBQUk7QUFDVixNQUFNLDBEQUFJO0FBQ1Y7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxhQUFhLE9BQU87QUFDcEIsZUFBZSxFQUFFO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxlQUFlLFFBQVE7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVlLDJFQUFZLEVBQUM7Ozs7Ozs7Ozs7Ozs7QUN4SjVCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUtzQjs7QUFFcUQ7QUFDRDtBQUN6QztBQUNlOztBQUVoRDtBQUNBLGFBQWEsUUFBUTtBQUNyQixjQUFjLDZCQUE2QjtBQUMzQyxjQUFjLDZCQUE2QjtBQUMzQyxjQUFjLDZCQUE2QjtBQUMzQyxjQUFjLDZCQUE2QjtBQUMzQzs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLE9BQU87QUFDMUI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBLHNCQUFzQixtREFBTztBQUM3QixvQkFBb0IsaURBQUs7QUFDekIsNEJBQTRCLGtEQUFNO0FBQ2xDLDBCQUEwQixrREFBTTs7QUFFaEM7QUFDQTtBQUNBO0FBQ0EsMENBQTBDLGtCQUFrQixnQkFBZ0IsRUFBRSxFQUFFOztBQUVoRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhLE9BQU87QUFDcEIsYUFBYSxTQUFTO0FBQ3RCO0FBQ0EsV0FBVyx1QkFBdUI7QUFDbEM7QUFDQSxZQUFZLHFEQUFPOztBQUVuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhLE9BQU87QUFDcEIsYUFBYSxTQUFTO0FBQ3RCO0FBQ0EsV0FBVyxxQkFBcUI7QUFDaEM7QUFDQSxjQUFjLHlEQUFXOztBQUV6QjtBQUNBO0FBQ0E7QUFDQSxhQUFhLGVBQWU7QUFDNUIsYUFBYSxRQUFRO0FBQ3JCLGFBQWEsUUFBUTtBQUNyQjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsYUFBYSxPQUFPO0FBQ3BCLGVBQWUsOEJBQThCO0FBQzdDO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxhQUFhLE9BQU87QUFDcEIsZUFBZSxvQ0FBb0M7QUFDbkQ7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsYUFBYSxPQUFPO0FBQ3BCLGVBQWUsMkNBQTJDO0FBQzFEO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGFBQWEsT0FBTztBQUNwQixlQUFlLDhCQUE4QjtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLG9FQUFNO0FBQ2pDO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLDBEQUFJO0FBQ1I7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsdUNBQXVDLG9FQUFNO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQLEtBQUs7QUFDTDtBQUNBLElBQUksMERBQUk7QUFDUjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSx3Q0FBd0Msb0VBQU07QUFDOUM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1AsS0FBSztBQUNMO0FBQ0EsSUFBSSwwREFBSTtBQUNSOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGFBQWEsT0FBTztBQUNwQixhQUFhLE9BQU87QUFDcEIsYUFBYSxPQUFPO0FBQ3BCLGFBQWEsT0FBTztBQUNwQjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQSxJQUFJLDZEQUFPLFVBQVUsK0RBQW1CO0FBQ3hDO0FBQ0EsS0FBSztBQUNMLElBQUksNkRBQU8sVUFBVSwrREFBbUI7QUFDeEM7QUFDQTtBQUNBOztBQUVBLGdDQUFnQyx5QkFBeUI7QUFDekQsS0FBSztBQUNMLElBQUksNkRBQU8sVUFBVSxpRUFBcUI7QUFDMUM7QUFDQTtBQUNBOztBQUVBLGdDQUFnQyx5QkFBeUI7QUFDekQsS0FBSztBQUNMLElBQUksNkRBQU8sVUFBVSxpRUFBcUI7QUFDMUM7QUFDQTtBQUNBOztBQUVBLGdDQUFnQyxXQUFXO0FBQzNDLEtBQUs7O0FBRUw7QUFDQSxNQUFNLDZEQUFPLENBQUMsa0VBQXdCO0FBQ3RDLE1BQU0sNkRBQU8sQ0FBQyx3REFBYztBQUM1Qjs7QUFFQTtBQUNBLElBQUksMERBQUk7QUFDUjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksa0VBQVk7QUFDaEI7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFZSwwRUFBVyxFQUFDOzs7Ozs7Ozs7Ozs7O0FDN1IzQjtBQUFBO0FBQUE7QUFBMEM7O0FBRTNCO0FBQ2Y7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0EsR0FBRztBQUNILHlCQUF5Qix5REFBUTtBQUNqQyx1QkFBdUIseURBQVE7QUFDL0IsQ0FBQyxFQUFDOzs7Ozs7Ozs7Ozs7O0FDWEY7QUFBQTtBQUFBO0FBQ0E7QUFDQTs7QUFFZTtBQUNmO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7O0FDbEVBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBa0M7O0FBRTNCLGtCQUFrQixnREFBUztBQUMzQjtBQUNQO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhLFFBQVE7QUFDckI7QUFDTztBQUNQO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxPQUFPO0FBQ2xCLGFBQWEsT0FBTztBQUNwQjtBQUNPO0FBQ1A7QUFDQTtBQUNBLHNEQUFzRCxhQUFhLEVBQUU7QUFDckU7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBLEtBQUs7O0FBRUw7QUFDQTs7QUFFQTtBQUNBOztBQUVPO0FBQ1A7QUFDQTtBQUNBLHNEQUFzRCxhQUFhLEVBQUU7QUFDckU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7QUFFTDtBQUNBOztBQUVBO0FBQ0E7O0FBRU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFTztBQUNQO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQixpQkFBaUI7QUFDbEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVPO0FBQ1A7QUFDQTtBQUNBLGlCQUFpQixpQkFBaUI7QUFDbEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsT0FBTztBQUNsQixhQUFhLE9BQU87QUFDcEI7QUFDTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRzs7QUFFSDtBQUNBOztBQUVPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRzs7QUFFSDtBQUNBOztBQUVPO0FBQ1A7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQSxxQkFBcUIsMEJBQTBCO0FBQy9DOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7Ozs7Ozs7O0FDL0tBO0FBQUE7QUFBQTtBQUEyQzs7QUFFM0M7QUFDQTs7QUFFQTtBQUNBLDRCQUE0QiwwQkFBMEIsRUFBRTtBQUN4RCx5QkFBeUIsZ0JBQWdCLEVBQUU7QUFDM0MsdUJBQXVCLG1CQUFtQixFQUFFO0FBQzVDLGdDQUFnQyw2QkFBNkIsRUFBRTtBQUMvRCw2QkFBNkIsZ0JBQWdCLEVBQUU7QUFDL0MsNkNBQTZDLHVDQUF1QyxFQUFFO0FBQ3RGLCtDQUErQyx1Q0FBdUM7QUFDdEYsbUNBQW1DLHlCQUF5QixFQUFFO0FBQzlELHNDQUFzQyx3RUFBd0U7QUFDOUcsbUNBQW1DLHFDQUFxQyxFQUFFO0FBQzFFLDBDQUEwQywwRUFBMEUsRUFBRTtBQUN0SCx1Q0FBdUMscUNBQXFDLEVBQUU7QUFDOUUseUNBQXlDLHNDQUFzQyxFQUFFO0FBQ2pGO0FBQ0EsOEJBQThCLHdCQUF3QjtBQUN0RDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLG1CQUFtQiw0REFBTTtBQUN6QjtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7OztBQUdBO0FBQ0EsU0FBUyxRQUFROztBQUVqQjtBQUNBO0FBQ0E7O0FBRUEsaUJBQWlCLGtCQUFrQjtBQUNuQztBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7Ozs7Ozs7Ozs7OztBQ3BJQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBcUQ7QUFDVjtBQUNJOztBQUUvQzs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYSxZQUFZO0FBQ3pCO0FBQ087QUFDUDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHNDQUFzQyxZQUFZO0FBQ2xEO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYyxZQUFZO0FBQzFCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsU0FBUyxpRUFBVztBQUNwQjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLE9BQU87QUFDbEIsV0FBVyxPQUFPO0FBQ2xCLGFBQWEseUJBQXlCO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBOztBQUVBLFNBQVMsaUVBQVc7QUFDcEI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0IsNERBQU07QUFDMUIsV0FBVztBQUNYO0FBQ0EsT0FBTztBQUNQO0FBQ0EsR0FBRztBQUNIOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLFNBQVMsaUVBQVc7QUFDcEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIOztBQUVBO0FBQ0EsU0FBUyxpRUFBVztBQUNwQjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLHlCQUF5Qiw4RkFBYyxHQUFHLGdHQUFlO0FBQ3pEO0FBQ0E7QUFDQTtBQUNBLDBDQUEwQztBQUMxQztBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsR0FBRztBQUNIOztBQUVlO0FBQ2YsU0FBUyxpRUFBVztBQUNwQjtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLGNBQWMsb0VBQU0sRUFBRSxvQkFBb0I7O0FBRTFDO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsV0FBVyxvRUFBTSxFQUFFLG9CQUFvQjtBQUN2QztBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0EsR0FBRztBQUNIOzs7Ozs7Ozs7Ozs7O0FDdExBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBcUQ7QUFDSDs7QUFFUDtBQUNJO0FBQ0E7QUFDVjs7QUFFckM7QUFDQTs7QUFFTztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRVA7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxTQUFTLG9FQUFzQjtBQUMvQjs7QUFFQTtBQUNBLFNBQVMsb0VBQXNCO0FBQy9COztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7O0FBRUE7QUFDTztBQUNQO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EscUJBQXFCLCtEQUFRO0FBQzdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsS0FBSztBQUNMOztBQUVBOztBQUVBO0FBQ0E7QUFDQSw0QkFBNEIsNERBQWMsR0FBRztBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxJQUFJLDBEQUFJO0FBQ1I7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTOztBQUVUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVzs7QUFFWDtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87O0FBRVA7QUFDQSwwQkFBMEIsK0RBQWlCLGtCQUFrQiw0REFBYztBQUMzRTtBQUNBLEtBQUs7O0FBRUwsSUFBSSwwREFBSTtBQUNSO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQiw0REFBYyxHQUFHO0FBQ3JDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLE1BQU0saUVBQW1CO0FBQ3pCO0FBQ0EsT0FBTztBQUNQLEtBQUs7QUFDTDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0IsNERBQWMsR0FBRztBQUNyQztBQUNBLE1BQU0saUVBQW1CO0FBQ3pCO0FBQ0EsT0FBTztBQUNQLEtBQUs7QUFDTDs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsTUFBTSwwREFBSTtBQUNWO0FBQ0EsS0FBSztBQUNMLE1BQU0sMERBQUk7QUFDVjtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEtBQUs7O0FBRUw7QUFDQTtBQUNBLEtBQUs7O0FBRUw7QUFDQTtBQUNBLEtBQUs7O0FBRUwsSUFBSSwwREFBSTtBQUNSOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSwwREFBSTtBQUNSO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxLQUFLOztBQUVMO0FBQ0E7QUFDQSxLQUFLOztBQUVMO0FBQ0E7QUFDQSxLQUFLOztBQUVMO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTSw0REFBUTtBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBLE1BQU0sMERBQUk7QUFDVjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU0sNERBQVE7QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBLGVBQWU7QUFDZixPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0EsTUFBTSwwREFBSTtBQUNWOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLGlFQUFXO0FBQy9CO0FBQ0E7QUFDQSxLQUFLOztBQUVMO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQiwrREFBaUI7QUFDdEMsZ0JBQWdCLCtEQUFpQjtBQUNqQztBQUNBO0FBQ0EsR0FBRzs7QUFFSDs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLDZEQUFPLFVBQVUsMkRBQWU7QUFDcEM7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFZSx5RUFBVSxFQUFDOzs7Ozs7Ozs7Ozs7O0FDemdCMUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSw4QkFBOEI7QUFDOUIsa0NBQWtDO0FBQ2xDLDhCQUE4QjtBQUM5Qjs7QUFFTztBQUNQO0FBQ0E7QUFDQTtBQUNBOztBQUVPO0FBQ1A7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRU87QUFDUDs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBOztBQUVPO0FBQ1A7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDs7Ozs7Ozs7Ozs7O0FDekZBLG9DOzs7Ozs7Ozs7OztBQ0FBLDJCOzs7Ozs7Ozs7OztBQ0FBLHNCOzs7Ozs7Ozs7OztBQ0FBLHVCIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gb2JqZWN0IHRvIHN0b3JlIGxvYWRlZCBjaHVua3NcbiBcdC8vIFwiMFwiIG1lYW5zIFwiYWxyZWFkeSBsb2FkZWRcIlxuIFx0dmFyIGluc3RhbGxlZENodW5rcyA9IHtcbiBcdFx0XCJtYWluXCI6IDBcbiBcdH07XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGdldHRlciB9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yID0gZnVuY3Rpb24oZXhwb3J0cykge1xuIFx0XHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcbiBcdFx0fVxuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuIFx0fTtcblxuIFx0Ly8gY3JlYXRlIGEgZmFrZSBuYW1lc3BhY2Ugb2JqZWN0XG4gXHQvLyBtb2RlICYgMTogdmFsdWUgaXMgYSBtb2R1bGUgaWQsIHJlcXVpcmUgaXRcbiBcdC8vIG1vZGUgJiAyOiBtZXJnZSBhbGwgcHJvcGVydGllcyBvZiB2YWx1ZSBpbnRvIHRoZSBuc1xuIFx0Ly8gbW9kZSAmIDQ6IHJldHVybiB2YWx1ZSB3aGVuIGFscmVhZHkgbnMgb2JqZWN0XG4gXHQvLyBtb2RlICYgOHwxOiBiZWhhdmUgbGlrZSByZXF1aXJlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnQgPSBmdW5jdGlvbih2YWx1ZSwgbW9kZSkge1xuIFx0XHRpZihtb2RlICYgMSkgdmFsdWUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKHZhbHVlKTtcbiBcdFx0aWYobW9kZSAmIDgpIHJldHVybiB2YWx1ZTtcbiBcdFx0aWYoKG1vZGUgJiA0KSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICYmIHZhbHVlLl9fZXNNb2R1bGUpIHJldHVybiB2YWx1ZTtcbiBcdFx0dmFyIG5zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yKG5zKTtcbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG5zLCAnZGVmYXVsdCcsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHZhbHVlIH0pO1xuIFx0XHRpZihtb2RlICYgMiAmJiB0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIGZvcih2YXIga2V5IGluIHZhbHVlKSBfX3dlYnBhY2tfcmVxdWlyZV9fLmQobnMsIGtleSwgZnVuY3Rpb24oa2V5KSB7IHJldHVybiB2YWx1ZVtrZXldOyB9LmJpbmQobnVsbCwga2V5KSk7XG4gXHRcdHJldHVybiBucztcbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIHVuY2F1Z2h0IGVycm9yIGhhbmRsZXIgZm9yIHdlYnBhY2sgcnVudGltZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vZSA9IGZ1bmN0aW9uKGVycikge1xuIFx0XHRwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uKCkge1xuIFx0XHRcdHRocm93IGVycjsgLy8gY2F0Y2ggdGhpcyBlcnJvciBieSB1c2luZyBpbXBvcnQoKS5jYXRjaCgpXG4gXHRcdH0pO1xuIFx0fTtcblxuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IFwiLi9zcmMvaW5kZXguanNcIik7XG4iLCJpbXBvcnQgcmV0cmlldmUgZnJvbSAnLi9yZXRyaWV2ZS5qcyc7XG5cbmNvbnN0IERFTEFZID0gMTtcblxuZnVuY3Rpb24gZmFsbGJhY2tCZWFjb24odXJsLCBkYXRhLCBzeW5jKSB7XG4gIHJldHJpZXZlKHtcbiAgICBtZXRob2Q6ICdwb3N0JyxcbiAgICB1cmw6IHVybCxcbiAgICBkYXRhOiBkYXRhLFxuICAgIHN5bmM6IHN5bmNcbiAgfSlcbiAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgIH0pO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gRW1pdHRlcihlbmRwb2ludCkge1xuICBsZXQgbWVzc2FnZXMgPSBbXTtcbiAgbGV0IHRpbWVyO1xuXG4gIGZ1bmN0aW9uIHNlbmQodXJsLCBkYXRhLCBzeW5jKSB7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5uYXZpZ2F0b3Iuc2VuZEJlYWNvbikge1xuICAgICAgcmV0dXJuIHdpbmRvdy5uYXZpZ2F0b3Iuc2VuZEJlYWNvbih1cmwsIGRhdGEpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsbGJhY2tCZWFjb24odXJsLCBkYXRhLCBzeW5jKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB0cmFuc21pdCgpIHtcbiAgICBsZXQgc3luYyA9IGZhbHNlO1xuICAgIGlmICh0eXBlb2YgdGhpcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGNvbnN0IGN1cnJlbnRFdmVudCA9IHRoaXMuZXZlbnQgJiYgdGhpcy5ldmVudC50eXBlO1xuICAgICAgc3luYyA9IGN1cnJlbnRFdmVudCA9PT0gJ3VubG9hZCcgfHwgY3VycmVudEV2ZW50ID09PSAnYmVmb3JldW5sb2FkJztcbiAgICB9XG5cbiAgICBpZiAoIW1lc3NhZ2VzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGJhdGNoID0gbWVzc2FnZXM7XG4gICAgbWVzc2FnZXMgPSBbXTtcbiAgICBpZiAodGltZXIpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgfVxuICAgIHRpbWVyID0gdW5kZWZpbmVkO1xuXG4gICAgYmF0Y2guZm9yRWFjaChmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICBjb25zdCBlbmRwb2ludE1hdGNoID0gZW5kcG9pbnQubWF0Y2gobmV3IFJlZ0V4cCgnXFxcXC8odlxcXFxkKylcXFxcL1xcXFx3K1xcXFwvKFthLXpdKykkJykpO1xuICAgICAgaWYgKGVuZHBvaW50TWF0Y2hbMl0gPT09ICdhbmFseXRpY3MnICYmIGVuZHBvaW50TWF0Y2hbMV0gPT09ICd2MScpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBsZXQgZWRpdGVkTWVzc2FnZSA9IG1lc3NhZ2VcbiAgICAgIGlmIChlbmRwb2ludE1hdGNoWzFdID09PSAndjEnKSB7XG4gICAgICAgIC8vIGNoYW5nZSBuZWVkZWQgdG8gc3VwcG9ydCB2MSBvZiB0aGUgcGFydGljaXBhbnRzIGFwaVxuICAgICAgICBlZGl0ZWRNZXNzYWdlID0gbWVzc2FnZVsxXSB8fCB7fTtcbiAgICAgICAgZWRpdGVkTWVzc2FnZS50eXBlID0gbWVzc2FnZVswXTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFzZW5kKGVuZHBvaW50LCBKU09OLnN0cmluZ2lmeShlZGl0ZWRNZXNzYWdlKSwgc3luYykpIHtcbiAgICAgICAgbWVzc2FnZXMucHVzaChtZXNzYWdlKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXZvbHY6IFVuYWJsZSB0byBzZW5kIGJlYWNvbicpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKG1lc3NhZ2VzLmxlbmd0aCkge1xuICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KHRyYW5zbWl0LCBERUxBWSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3VubG9hZCcsIHRyYW5zbWl0KTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYmVmb3JldW5sb2FkJywgdHJhbnNtaXQpO1xuICB9XG5cbiAgdGhpcy5lbWl0ID0gZnVuY3Rpb24odHlwZSwgZGF0YSwgZmx1c2g9ZmFsc2UpIHtcbiAgICBtZXNzYWdlcy5wdXNoKFt0eXBlLCBkYXRhXSk7XG4gICAgaWYgKGZsdXNoKSB7XG4gICAgICB0cmFuc21pdCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghdGltZXIpIHtcbiAgICAgIHRpbWVyID0gc2V0VGltZW91dCh0cmFuc21pdCwgREVMQVkpO1xuICAgIH1cbiAgfTtcblxuICB0aGlzLmZsdXNoID0gdHJhbnNtaXQ7XG59XG4iLCJpbXBvcnQgKiBhcyBvYmplY3RzIGZyb20gJy4vcG9ueWZpbGxzL29iamVjdHMuanMnO1xuaW1wb3J0IHsgZW1pdCB9IGZyb20gJy4vd2FpdGZvcml0LmpzJztcblxuZXhwb3J0IGNvbnN0IENPTlRFWFRfQ0hBTkdFRCA9ICdjb250ZXh0LmNoYW5nZWQnO1xuZXhwb3J0IGNvbnN0IENPTlRFWFRfSU5JVElBTElaRUQgPSAnY29udGV4dC5pbml0aWFsaXplZCc7XG5leHBvcnQgY29uc3QgQ09OVEVYVF9WQUxVRV9SRU1PVkVEID0gJ2NvbnRleHQudmFsdWUucmVtb3ZlZCc7XG5leHBvcnQgY29uc3QgQ09OVEVYVF9WQUxVRV9BRERFRCA9ICdjb250ZXh0LnZhbHVlLmFkZGVkJztcbmV4cG9ydCBjb25zdCBDT05URVhUX1ZBTFVFX0NIQU5HRUQgPSAnY29udGV4dC52YWx1ZS5jaGFuZ2VkJztcbmV4cG9ydCBjb25zdCBDT05URVhUX0RFU1RST1lFRCA9ICdjb250ZXh0LmRlc3Ryb3llZCc7XG5cbi8qKlxuICogVGhlIEV2b2x2Q29udGV4dCBwcm92aWRlcyBmdW5jdGlvbmFsaXR5IHRvIG1hbmFnZSBkYXRhIHJlbGF0aW5nIHRvIHRoZSBjbGllbnQgc3RhdGUsIG9yIGNvbnRleHQgaW4gd2hpY2ggdGhlXG4gKiB2YXJpYW50cyB3aWxsIGJlIGFwcGxpZWQuXG4gKlxuICogVGhpcyBkYXRhIGlzIHVzZWQgZm9yIGRldGVybWluaW5nIHdoaWNoIHZhcmlhYmxlcyBhcmUgYWN0aXZlLCBhbmQgZm9yIGdlbmVyYWwgYW5hbHl0aWNzLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBFdm9sdkNvbnRleHQoKSB7XG4gIGxldCB1aWQ7XG4gIGxldCBzaWQ7XG4gIGxldCByZW1vdGVDb250ZXh0O1xuICBsZXQgbG9jYWxDb250ZXh0O1xuICBsZXQgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuICAvKipcbiAgICogQSB1bmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHBhcnRpY2lwYW50LlxuICAgKi9cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICd1aWQnLCB7IGdldDogZnVuY3Rpb24oKSB7IHJldHVybiB1aWQ7IH0gfSk7XG5cbiAgLyoqXG4gICAqIEEgdW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSBjdXJyZW50IHNlc3Npb24gb2YgdGhlIHBhcnRpY2lwYW50LlxuICAgKi9cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdzaWQnLCB7IGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBzaWQ7IH0gfSk7XG5cbiAgLyoqXG4gICAqIFRoZSBjb250ZXh0IGluZm9ybWF0aW9uIGZvciBldmFsdWF0aW9uIG9mIHByZWRpY2F0ZXMgYW5kIGFuYWx5dGljcy5cbiAgICovXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAncmVtb3RlQ29udGV4dCcsIHsgZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIG9iamVjdHMuZGVlcENsb25lKHJlbW90ZUNvbnRleHQpOyB9IH0pO1xuXG4gIC8qKlxuICAgKiBUaGUgY29udGV4dCBpbmZvcm1hdGlvbiBmb3IgZXZhbHVhdGlvbiBvZiBwcmVkaWNhdGVzIG9ubHksIGFuZCBub3QgdXNlZCBmb3IgYW5hbHl0aWNzLlxuICAgKi9cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdsb2NhbENvbnRleHQnLCB7IGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBvYmplY3RzLmRlZXBDbG9uZShsb2NhbENvbnRleHQpOyB9IH0pO1xuXG4gIGZ1bmN0aW9uIG11dGFibGVSZXNvbHZlKCkge1xuICAgIHJldHVybiBvYmplY3RzLmRlZXBNZXJnZShsb2NhbENvbnRleHQsIHJlbW90ZUNvbnRleHQpO1xuICB9XG5cbiAgZnVuY3Rpb24gZW5zdXJlSW5pdGlhbGl6ZWQoKSB7XG4gICAgaWYgKCFpbml0aWFsaXplZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFdm9sdjogVGhlIGV2b2x2IGNvbnRleHQgaXMgbm90IGluaXRpYWxpemVkJylcbiAgICB9XG4gIH1cblxuICB0aGlzLmluaXRpYWxpemUgPSBmdW5jdGlvbihfdWlkLCBfc2lkLCBfcmVtb3RlQ29udGV4dCwgX2xvY2FsQ29udGV4dCkge1xuICAgIGlmIChpbml0aWFsaXplZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFdm9sdjogVGhlIGNvbnRleHQgaXMgYWxyZWFkeSBpbml0aWFsaXplZCcpO1xuICAgIH1cbiAgICB1aWQgPSBfdWlkO1xuICAgIHNpZCA9IF9zaWQ7XG4gICAgcmVtb3RlQ29udGV4dCA9IF9yZW1vdGVDb250ZXh0ID8gb2JqZWN0cy5kZWVwQ2xvbmUoX3JlbW90ZUNvbnRleHQpIDoge307XG4gICAgbG9jYWxDb250ZXh0ID0gX2xvY2FsQ29udGV4dCA/IG9iamVjdHMuZGVlcENsb25lKF9sb2NhbENvbnRleHQpIDoge307XG4gICAgaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIGVtaXQodGhpcywgQ09OVEVYVF9JTklUSUFMSVpFRCwgdGhpcy5yZXNvbHZlKCkpO1xuICB9O1xuXG4gIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICAgIHJlbW90ZUNvbnRleHQgPSB1bmRlZmluZWQ7XG4gICAgbG9jYWxDb250ZXh0ID0gdW5kZWZpbmVkO1xuICAgIGVtaXQodGhpcywgQ09OVEVYVF9ERVNUUk9ZRUQsIHRoaXMpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDb21wdXRlcyB0aGUgZWZmZWN0aXZlIGNvbnRleHQgZnJvbSB0aGUgbG9jYWwgYW5kIHJlbW90ZSBjb250ZXh0cy5cbiAgICpcbiAgICogQHJldHVybnMge09iamVjdH0gVGhlIGVmZmVjdGl2ZSBjb250ZXh0IGZyb20gdGhlIGxvY2FsIGFuZCByZW1vdGUgY29udGV4dHMuXG4gICAqL1xuICB0aGlzLnJlc29sdmUgPSBmdW5jdGlvbigpIHtcbiAgICBlbnN1cmVJbml0aWFsaXplZCgpO1xuICAgIHJldHVybiBvYmplY3RzLmRlZXBDbG9uZShtdXRhYmxlUmVzb2x2ZSgpKTtcbiAgfTtcblxuICAvKipcbiAgICogU2V0cyBhIHZhbHVlIGluIHRoZSBjdXJyZW50IGNvbnRleHQuXG4gICAqXG4gICAqIFRoaXMgd2lsbCBjYXVzZSB0aGUgZWZmZWN0aXZlIGdlbm9tZSB0byBiZSByZWNvbXB1dGVkLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IHtTdHJpbmd9IFRoZSBrZXkgdG8gYXNzb2NpYXRlIHRoZSB2YWx1ZSB0by5cbiAgICogQHBhcmFtIHZhbHVlIHsqfSBUaGUgdmFsdWUgdG8gYXNzb2NpYXRlIHdpdGggdGhlIGtleS5cbiAgICogQHBhcmFtIGxvY2FsIHtCb29sZWFufSBJZiB0cnVlLCB0aGUgdmFsdWUgd2lsbCBvbmx5IGJlIGFkZGVkIHRvIHRoZSBsb2NhbENvbnRleHQuXG4gICAqL1xuICB0aGlzLnNldCA9IGZ1bmN0aW9uKGtleSwgdmFsdWUsIGxvY2FsKSB7XG4gICAgZW5zdXJlSW5pdGlhbGl6ZWQoKTtcbiAgICBjb25zdCBjb250ZXh0ID0gbG9jYWwgPyBsb2NhbENvbnRleHQgOiByZW1vdGVDb250ZXh0O1xuICAgIGNvbnN0IGJlZm9yZSA9IG9iamVjdHMuZ2V0VmFsdWVGb3JLZXkoa2V5LCBjb250ZXh0KTtcbiAgICBvYmplY3RzLnNldEtleVRvVmFsdWUoa2V5LCB2YWx1ZSwgY29udGV4dCk7XG5cbiAgICBjb25zdCB1cGRhdGVkID0gdGhpcy5yZXNvbHZlKCk7XG4gICAgaWYgKHR5cGVvZiBiZWZvcmUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBlbWl0KHRoaXMsIENPTlRFWFRfVkFMVUVfQURERUQsIGtleSwgdmFsdWUsIGxvY2FsLCB1cGRhdGVkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZW1pdCh0aGlzLCBDT05URVhUX1ZBTFVFX0NIQU5HRUQsIGtleSwgdmFsdWUsIGJlZm9yZSwgbG9jYWwsIHVwZGF0ZWQpO1xuICAgIH1cbiAgICBlbWl0KHRoaXMsIENPTlRFWFRfQ0hBTkdFRCwgdXBkYXRlZCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhIHNwZWNpZmllZCBrZXkgZnJvbSB0aGUgY29udGV4dC5cbiAgICpcbiAgICogVGhpcyB3aWxsIGNhdXNlIHRoZSBlZmZlY3RpdmUgZ2Vub21lIHRvIGJlIHJlY29tcHV0ZWQuXG4gICAqXG4gICAqIEBwYXJhbSBrZXkge1N0cmluZ30gVGhlIGtleSB0byByZW1vdmUgZnJvbSB0aGUgY29udGV4dC5cbiAgICovXG4gIHRoaXMucmVtb3ZlID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgZW5zdXJlSW5pdGlhbGl6ZWQoKTtcbiAgICBjb25zdCBsb2NhbCA9IG9iamVjdHMucmVtb3ZlVmFsdWVGb3JLZXkoa2V5LCBsb2NhbENvbnRleHQpO1xuICAgIGNvbnN0IHJlbW90ZSA9IG9iamVjdHMucmVtb3ZlVmFsdWVGb3JLZXkoa2V5LCByZW1vdGVDb250ZXh0KTtcbiAgICBjb25zdCByZW1vdmVkID0gbG9jYWwgfHwgcmVtb3RlO1xuXG4gICAgaWYgKHJlbW92ZWQpIHtcbiAgICAgIGNvbnN0IHVwZGF0ZWQgPSB0aGlzLnJlc29sdmUoKTtcbiAgICAgIGVtaXQodGhpcywgQ09OVEVYVF9WQUxVRV9SRU1PVkVELCBrZXksICFyZW1vdGUsIHVwZGF0ZWQpO1xuICAgICAgZW1pdCh0aGlzLCBDT05URVhUX0NIQU5HRUQsIHVwZGF0ZWQpO1xuICAgIH1cblxuICAgIHJldHVybiByZW1vdmVkO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZSBhIHZhbHVlIGZyb20gdGhlIGNvbnRleHQuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBrZXkgVGhlIGtheSBhc3NvY2lhdGVkIHdpdGggdGhlIHZhbHVlIHRvIHJldHJpZXZlLlxuICAgKiBAcmV0dXJucyB7Kn0gVGhlIHZhbHVlIGFzc29jaWF0ZWQgd2l0aCB0aGUgc3BlY2lmaWVkIGtleS5cbiAgICovXG4gIHRoaXMuZ2V0ID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgZW5zdXJlSW5pdGlhbGl6ZWQoKTtcbiAgICByZXR1cm4gKHJlbW90ZUNvbnRleHRba2V5XSB8fCBsb2NhbENvbnRleHRba2V5XSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgc3BlY2lmaWVkIGtleSBpcyBjdXJyZW50bHkgZGVmaW5lZCBpbiB0aGUgY29udGV4dC5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUga2V5IGhhcyBhbiBhc3NvY2lhdGVkIHZhbHVlIGluIHRoZSBjb250ZXh0LlxuICAgKi9cbiAgdGhpcy5jb250YWlucyA9IGZ1bmN0aW9uKGtleSkge1xuICAgIGVuc3VyZUluaXRpYWxpemVkKCk7XG4gICAgcmV0dXJuIGtleSBpbiByZW1vdGVDb250ZXh0IHx8IGtleSBpbiBsb2NhbENvbnRleHQ7XG4gIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IEV2b2x2Q29udGV4dDtcbiIsImltcG9ydCBDb250ZXh0LCB7XG4gIENPTlRFWFRfSU5JVElBTElaRUQsXG4gIENPTlRFWFRfVkFMVUVfQURERUQsXG4gIENPTlRFWFRfVkFMVUVfQ0hBTkdFRCxcbiAgQ09OVEVYVF9WQUxVRV9SRU1PVkVEXG59IGZyb20gJy4vY29udGV4dC5qcyc7XG5cbmltcG9ydCBTdG9yZSwge0VGRkVDVElWRV9HRU5PTUVfVVBEQVRFRCwgUkVRVUVTVF9GQUlMRUR9IGZyb20gJy4vc3RvcmUuanMnO1xuaW1wb3J0IHsgd2FpdEZvciwgd2FpdE9uY2VGb3IsIGVtaXQsIGRlc3Ryb3lTY29wZSB9IGZyb20gJy4vd2FpdGZvcml0LmpzJztcbmltcG9ydCBCZWFjb24gZnJvbSAnLi9iZWFjb24uanMnO1xuaW1wb3J0IHsgYXNzaWduIH0gZnJvbSAnLi9wb255ZmlsbHMvb2JqZWN0cy5qcyc7XG5cbi8qKlxuICogQHR5cGVkZWYge1Byb21pc2V9IFN1YnNjcmliYWJsZVByb21pc2VcbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb24oZnVuY3Rpb24pOnVuZGVmaW5lZH0gdGhlbiBUaGVuXG4gKiBAcHJvcGVydHkge2Z1bmN0aW9uKGZ1bmN0aW9uKTp1bmRlZmluZWR9IGxpc3RlbiBMaXN0ZW5cbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb24oZnVuY3Rpb24pOnVuZGVmaW5lZH0gY2F0Y2ggQ2F0Y2hcbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb24oZnVuY3Rpb24pOnVuZGVmaW5lZH0gZmluYWxseSBGaW5hbGx5XG4gKi9cblxuLyoqXG4gKiBUaGUgRXZvbHZDbGllbnQgcHJvdmlkZXMgYSBsb3cgbGV2ZWwgaW50ZWdyYXRpb24gd2l0aCB0aGUgRXZvbHYgcGFydGljaXBhbnQgQVBJcy5cbiAqXG4gKiBUaGUgY2xpZW50IHByb3ZpZGVzIGFzeW5jaHJvbm91cyBhY2Nlc3MgdG8ga2V5IHN0YXRlcywgdmFsdWVzLCBjb250ZXh0cywgYW5kIGNvbmZpZ3VyYXRpb25zLlxuICpcbiAqIEBwYXJhbSBvcHRpb25zIHtPYmplY3R9IEFuIG9iamVjdCBvZiBvcHRpb25zIGZvciB0aGUgY2xpZW50LlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEV2b2x2Q2xpZW50KG9wdGlvbnMpIHtcbiAgbGV0IGluaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgaWYgKCFvcHRpb25zLmVudikge1xuICAgIHRocm93IG5ldyBFcnJvcignXCJlbnZcIiBtdXN0IGJlIHNwZWNpZmllZCcpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBvcHRpb25zLmF1dG9Db25maXJtID09PSAndW5kZWZpbmVkJykge1xuICAgIG9wdGlvbnMuYXV0b0NvbmZpcm0gPSB0cnVlO1xuICB9XG5cbiAgb3B0aW9ucy5lbmRwb2ludCA9IG9wdGlvbnMuZW5kcG9pbnQgfHwgJ2h0dHBzOi8vcGFydGljaXBhbnRzLmV2b2x2LmFpLyc7XG4gIG9wdGlvbnMudmVyc2lvbiA9IG9wdGlvbnMudmVyc2lvbiB8fCAxO1xuXG4gIGNvbnN0IGNvbnRleHQgPSBuZXcgQ29udGV4dChvcHRpb25zKTtcbiAgY29uc3Qgc3RvcmUgPSBuZXcgU3RvcmUob3B0aW9ucyk7XG4gIGNvbnN0IGNvbnRleHRCZWFjb24gPSBuZXcgQmVhY29uKG9wdGlvbnMuZW5kcG9pbnQgKyAnLycgKyBvcHRpb25zLmVudiArICcvYW5hbHl0aWNzJyk7XG4gIGNvbnN0IGV2ZW50QmVhY29uID0gbmV3IEJlYWNvbihvcHRpb25zLmVuZHBvaW50ICsgJy8nICsgb3B0aW9ucy5lbnYgKyAnL2V2ZW50cycpO1xuXG4gIC8qKlxuICAgKiBUaGUgY29udGV4dCBhZ2FpbnN0IHdoaWNoIHRoZSBrZXkgcHJlZGljYXRlcyB3aWxsIGJlIGV2YWx1YXRlZC5cbiAgICovXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnY29udGV4dCcsIHsgZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIGNvbnRleHQ7IH0gfSk7XG5cbiAgLyoqXG4gICAqIEFkZCBsaXN0ZW5lcnMgdG8gbGlmZWN5Y2xlIGV2ZW50cyB0aGF0IHRha2UgcGxhY2UgaW4gdG8gY2xpZW50LlxuICAgKlxuICAgKiBDdXJyZW50bHkgc3VwcG9ydGVkIGV2ZW50czpcbiAgICogKiBJTklUSUFMSVpFRCAtIENhbGxlZCB3aGVuIHRoZSBjbGllbnQgaXMgZnVsbHkgaW5pdGlhbGl6ZWQgYW5kIHJlYWR5IGZvciB1c2Ugd2l0aCAodG9waWMsIG9wdGlvbnMpXG4gICAqICogQ09OVEVYVF9JTklUSUFMSVpFRCA9IENhbGxlZCB3aGVuIHRoZSBjb250ZXh0IGlzIGZ1bGx5IGluaXRpYWxpemVkIGFuZCByZWFkeSBmb3IgdXNlIHdpdGggKHRvcGljLCB1cGRhdGVkX2NvbnRleHQpXG4gICAqICogQ09OVEVYVF9DSEFOR0VEIC0gQ2FsbGVkIHdoZW5ldmVyIGEgY2hhbmdlIGlzIG1hZGUgdG8gdGhlIGNvbnRleHQgdmFsdWVzIHdpdGggKHRvcGljLCB1cGRhdGVkX2NvbnRleHQpXG4gICAqICogQ09OVEVYVF9WQUxVRV9SRU1PVkVEIC0gQ2FsbGVkIHdoZW4gYSB2YWx1ZSBpcyByZW1vdmVkIGZyb20gY29udGV4dCB3aXRoICh0b3BpYywga2V5LCB1cGRhdGVkX2NvbnRleHQpXG4gICAqICogQ09OVEVYVF9WQUxVRV9BRERFRCAtIENhbGxlZCB3aGVuIGEgbmV3IHZhbHVlIGlzIGFkZGVkIHRvIHRoZSBjb250ZXh0IHdpdGggKHRvcGljLCBrZXksIHZhbHVlLCBsb2NhbCwgdXBkYXRlZF9jb250ZXh0KVxuICAgKiAqIENPTlRFWFRfVkFMVUVfQ0hBTkdFRCAtIENhbGxlZCB3aGVuIGEgdmFsdWUgaXMgY2hhbmdlZCBpbiB0aGUgY29udGV4dCAodG9waWMsIGtleSwgdmFsdWUsIGJlZm9yZSwgbG9jYWwsIHVwZGF0ZWRfY29udGV4dClcbiAgICogKiBDT05URVhUX0RFU1RST1lFRCAtIENhbGxlZCB3aGVuIHRoZSBjb250ZXh0IGlzIGRlc3Ryb3llZCB3aXRoICh0b3BpYywgY29udGV4dClcbiAgICogKiBHRU5PTUVfUkVRVUVTVF9TRU5UIC0gQ2FsbGVkIHdoZW4gYSByZXF1ZXN0IGZvciBhIGdlbm9tZSBpcyBzZW50IHdpdGggKHRvcGljLCByZXF1ZXN0ZWRfa2V5cylcbiAgICogKiBDT05GSUdfUkVRVUVTVF9TRU5UIC0gQ2FsbGVkIHdoZW4gYSByZXF1ZXN0IGZvciBhIGNvbmZpZyBpcyBzZW50IHdpdGggKHRvcGljLCByZXF1ZXN0ZWRfa2V5cylcbiAgICogKiBHRU5PTUVfUkVRVUVTVF9SRUNFSVZFRCAtIENhbGxlZCB3aGVuIHRoZSByZXN1bHQgb2YgYSByZXF1ZXN0IGZvciBhIGdlbm9tZSBpcyByZWNlaXZlZCAodG9waWMsIHJlcXVlc3RlZF9rZXlzKVxuICAgKiAqIENPTkZJR19SRVFVRVNUX1JFQ0VJVkVEIC0gQ2FsbGVkIHdoZW4gdGhlIHJlc3VsdCBvZiBhIHJlcXVlc3QgZm9yIGEgY29uZmlnIGlzIHJlY2VpdmVkICh0b3BpYywgcmVxdWVzdGVkX2tleXMpXG4gICAqICogUkVRVUVTVF9GQUlMRUQgLSBDYWxsZWQgd2hlbiBhIHJlcXVlc3QgZmFpbHMgKHRvcGljLCBzb3VyY2UsIHJlcXVlc3RlZF9rZXlzLCBlcnJvcilcbiAgICogKiBHRU5PTUVfVVBEQVRFRCAtIENhbGxlZCB3aGVuIHRoZSBzdG9yZWQgZ2Vub21lIGlzIHVwZGF0ZWQgKHRvcGljLCBhbGxvY2F0aW9uX3Jlc3BvbnNlKVxuICAgKiAqIENPTkZJR19VUERBVEVEIC0gQ2FsbGVkIHdoZW4gdGhlIHN0b3JlZCBjb25maWcgaXMgdXBkYXRlZCAodG9waWMsIGNvbmZpZ19yZXNwb25zZSlcbiAgICogKiBFRkZFQ1RJVkVfR0VOT01FX1VQREFURUQgLSBDYWxsZWQgd2hlbiB0aGUgZWZmZWN0aXZlIGdlbm9tZSBpcyB1cGRhdGVkICh0b3BpYywgZWZmZWN0aXZlR2Vub21lKVxuICAgKiAqIFNUT1JFX0RFU1RST1lFRCAtIENhbGxlZCB3aGVuIHRoZSBzdG9yZSBpcyBkZXN0cm95ZWQgKHRvcGljLCBzdG9yZSlcbiAgICogKiBDT05GSVJNRUQgLSBDYWxsZWQgd2hlbiB0aGUgY29uc3VtZXIgaXMgY29uZmlybWVkICh0b3BpYylcbiAgICogKiBDT05UQU1JTkFURUQgLSBDYWxsZWQgd2hlbiB0aGUgY29uc3VtZXIgaXMgY29udGFtaW5hdGVkICh0b3BpYylcbiAgICogKiBFVkVOVF9FTUlUVEVEIC0gQ2FsbGVkIHdoZW4gYW4gZXZlbnQgaXMgZW1pdHRlZCB0aHJvdWdoIHRoZSBiZWFjb24gKHRvcGljLCB0eXBlLCBzY29yZSlcbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHRvcGljIFRoZSBldmVudCB0b3BpYyBvbiB3aGljaCB0aGUgbGlzdGVuZXIgc2hvdWxkIGJlIGludm9rZWQuXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIFRoZSBsaXN0ZW5lciB0byBiZSBpbnZva2VkIGZvciB0aGUgc3BlY2lmaWVkIHRvcGljLlxuICAgKiBAbWV0aG9kXG4gICAqIEBzZWUge0BsaW5rIEV2b2x2Q2xpZW50I29uY2V9IGZvciBsaXN0ZW5lcnMgdGhhdCBzaG91bGQgb25seSBiZSBpbnZva2VkIG9uY2UuXG4gICAqL1xuICB0aGlzLm9uID0gd2FpdEZvci5iaW5kKHVuZGVmaW5lZCwgY29udGV4dCk7XG5cbiAgLyoqXG4gICAqIEFkZCBhIGxpc3RlbmVyIHRvIGEgbGlmZWN5Y2xlIGV2ZW50IHRvIGJlIGludm9rZWQgb25jZSBvbiB0aGUgbmV4dCBpbnN0YW5jZSBvZiB0aGVcbiAgICogZXZlbnQgdG8gdGFrZSBwbGFjZSBpbiB0byBjbGllbnQuXG4gICAqXG4gICAqIFNlZSB0aGUgXCJvblwiIGZ1bmN0aW9uIGZvciBzdXBwb3J0ZWQgZXZlbnRzLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gdG9waWMgVGhlIGV2ZW50IHRvcGljIG9uIHdoaWNoIHRoZSBsaXN0ZW5lciBzaG91bGQgYmUgaW52b2tlZC5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgVGhlIGxpc3RlbmVyIHRvIGJlIGludm9rZWQgZm9yIHRoZSBzcGVjaWZpZWQgdG9waWMuXG4gICAqIEBtZXRob2RcbiAgICogQHNlZSB7QGxpbmsgRXZvbHZDbGllbnQjb259IGZvciBsaXN0ZW5lcnMgdGhhdCBzaG91bGQgYmUgaW52b2tlZCBvbiBlYWNoIGV2ZW50LlxuICAgKi9cbiAgdGhpcy5vbmNlID0gd2FpdE9uY2VGb3IuYmluZCh1bmRlZmluZWQsIGNvbnRleHQpO1xuXG4gIC8qKlxuICAgKiBQcmVsb2FkIGFsbCBrZXlzIHVuZGVyIHVuZGVyIHRoZSBzcGVjaWZpZWQgcHJlZml4ZXMuXG4gICAqXG4gICAqIEBwYXJhbSB7QXJyYXkuPFN0cmluZz59IHByZWZpeGVzIEEgbGlzdCBvZiBwcmVmaXhlcyB0byBrZXlzIHRvIGxvYWQuXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gY29uZmlnT25seSBJZiB0cnVlLCBvbmx5IHRoZSBjb25maWcgd291bGQgYmUgbG9hZGVkLiAoZGVmYXVsdDogZmFsc2UpXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gaW1tZWRpYXRlIEZvcmNlcyB0aGUgcmVxdWVzdHMgdG8gdGhlIHNlcnZlci4gKGRlZmF1bHQ6IGZhbHNlKVxuICAgKiBAbWV0aG9kXG4gICAqL1xuICB0aGlzLnByZWxvYWQgPSBzdG9yZS5wcmVsb2FkLmJpbmQoc3RvcmUpO1xuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHZhbHVlIG9mIGEgc3BlY2lmaWVkIGtleS5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byByZXRyaWV2ZS5cbiAgICogQHJldHVybnMge1N1YnNjcmliYWJsZVByb21pc2UuPCp8RXJyb3I+fSBBIFN1YnNjcmliYWJsZVByb21pc2UgdGhhdCByZXNvbHZlcyB0byB0aGUgdmFsdWUgb2YgdGhlIHNwZWNpZmllZCBrZXkuXG4gICAqIEBtZXRob2RcbiAgICovXG4gIHRoaXMuZ2V0ID0gc3RvcmUuZ2V0LmJpbmQoc3RvcmUpO1xuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhIHNwZWNpZmllZCBrZXkgaXMgY3VycmVudGx5IGFjdGl2ZS5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IGtleSBUaGUga2V5IHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyB7U3Vic2NyaWJhYmxlUHJvbWlzZS48Qm9vbGVhbnxFcnJvcj59IEEgU3Vic2NyaWJhYmxlUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIHRydWUgaWYgdGhlIHNwZWNpZmllZCBrZXkgaXNcbiAgICogYWN0aXZlLlxuICAgKiBAbWV0aG9kXG4gICAqL1xuICB0aGlzLmlzQWN0aXZlID0gc3RvcmUuaXNBY3RpdmUuYmluZChzdG9yZSk7XG5cbiAgLyoqXG4gICAqIENoZWNrIGFsbCBhY3RpdmUga2V5cyB0aGF0IHN0YXJ0IHdpdGggdGhlIHNwZWNpZmllZCBwcmVmaXguXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcmVmaXggVGhlIHByZWZpeCBvZiB0aGUga2V5cyB0byBjaGVjay5cbiAgICogQHJldHVybnMge1N1YnNjcmliYWJsZVByb21pc2UuPEFycmF5LjxTdHJpbmc+fEVycm9yPn0gQSBTdWJzY3JpYmFibGVQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYW4gYXJyYXkgb2Yga2V5cyB3aGVuXG4gICAqIHRoZSBzcGVjaWZpZWQgcHJlZml4LlxuICAgKiBAbWV0aG9kXG4gICAqL1xuICB0aGlzLmdldEFjdGl2ZUtleXMgPSBzdG9yZS5nZXRBY3RpdmVLZXlzLmJpbmQoc3RvcmUpO1xuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGNvbmZpZ3VyYXRpb24gZm9yIGEgc3BlY2lmaWVkIGtleS5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IGtleSBUaGUga2V5IHRvIHJldHJpZXZlIHRoZSBjb25maWd1cmF0aW9uIGZvci5cbiAgICogQHJldHVybnMge1N1YnNjcmliYWJsZVByb21pc2UuPCp8RXJyb3I+fSBBIFN1YnNjcmliYWJsZVByb21pc2UgdGhhdCByZXNvbHZlcyB0byB0aGUgY29uZmlndXJhdGlvbiBvZiB0aGVcbiAgICogc3BlY2lmaWVkIGtleS5cbiAgICogQG1ldGhvZFxuICAgKi9cbiAgdGhpcy5nZXRDb25maWcgPSBzdG9yZS5nZXRDb25maWcuYmluZChzdG9yZSk7XG4gIHRoaXMuZW1pdCA9IGZ1bmN0aW9uKHR5cGUsIHNjb3JlLCBmbHVzaCkge1xuICAgIGV2ZW50QmVhY29uLmVtaXQodHlwZSwgYXNzaWduKHtcbiAgICAgIHVpZDogY29udGV4dC51aWQsXG4gICAgICBzaWQ6IGNvbnRleHQuc2lkLFxuICAgICAgc2NvcmU6IHNjb3JlXG4gICAgfSwgY29udGV4dC5yZW1vdGVDb250ZXh0KSwgZmx1c2gpO1xuICAgIGVtaXQoY29udGV4dCwgRXZvbHZDbGllbnQuRVZFTlRfRU1JVFRFRCwgdHlwZSwgc2NvcmUpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDb25maXJtIHRoYXQgdGhlIGNvbnN1bWVyIGhhcyBzdWNjZXNzZnVsbHkgcmVjZWl2ZWQgYW5kIGFwcGxpZWQgdmFsdWVzLCBtYWtpbmcgdGhlbSBlbGlnaWJsZSBmb3IgaW5jbHVzaW9uIGluXG4gICAqIG9wdGltaXphdGlvbiBzdGF0aXN0aWNzLlxuICAgKi9cbiAgdGhpcy5jb25maXJtID0gZnVuY3Rpb24oKSB7XG4gICAgY29uc3QgcmVtb3RlQ29udGV4dCA9IGNvbnRleHQucmVtb3RlQ29udGV4dDtcbiAgICBpZiAoXG4gICAgICAhcmVtb3RlQ29udGV4dC5leHBlcmltZW50cyB8fFxuICAgICAgIXJlbW90ZUNvbnRleHQuZXhwZXJpbWVudHMuYWxsb2NhdGlvbnMgfHwgIXJlbW90ZUNvbnRleHQuZXhwZXJpbWVudHMuYWxsb2NhdGlvbnMubGVuZ3RoXG4gICAgKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgcmVtb3RlQ29udGV4dC5leHBlcmltZW50cy5hbGxvY2F0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKGFsbG9jKSB7XG4gICAgICBldmVudEJlYWNvbi5lbWl0KCdjb25maXJtYXRpb24nLCBhc3NpZ24oe1xuICAgICAgICB1aWQ6IGFsbG9jLnVpZCxcbiAgICAgICAgc2lkOiBhbGxvYy5zaWQsXG4gICAgICAgIGVpZDogYWxsb2MuZWlkLFxuICAgICAgICBjaWQ6IGFsbG9jLmNpZFxuICAgICAgfSwgY29udGV4dC5yZW1vdGVDb250ZXh0KSk7XG4gICAgfSk7XG4gICAgZXZlbnRCZWFjb24uZmx1c2goKTtcbiAgICBlbWl0KGNvbnRleHQsIEV2b2x2Q2xpZW50LkNPTkZJUk1FRCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIE1hcmtzIGEgY29uc3VtZXIgYXMgdW5zdWNjZXNzZnVsbHkgcmV0cmlldmluZyBhbmQgLyBvciBhcHBseWluZyByZXF1ZXN0ZWQgdmFsdWVzLCBtYWtpbmcgdGhlbSBpbmVsaWdpYmxlIGZvclxuICAgKiBpbmNsdXNpb24gaW4gb3B0aW1pemF0aW9uIHN0YXRpc3RpY3MuXG4gICAqL1xuICB0aGlzLmNvbnRhbWluYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgY29uc3QgcmVtb3RlQ29udGV4dCA9IGNvbnRleHQucmVtb3RlQ29udGV4dDtcbiAgICBpZiAoXG4gICAgICAhcmVtb3RlQ29udGV4dC5leHBlcmltZW50cyB8fFxuICAgICAgIXJlbW90ZUNvbnRleHQuZXhwZXJpbWVudHMuYWxsb2NhdGlvbnMgfHwgIXJlbW90ZUNvbnRleHQuZXhwZXJpbWVudHMuYWxsb2NhdGlvbnMubGVuZ3RoXG4gICAgKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgcmVtb3RlQ29udGV4dC5leHBlcmltZW50cy5hbGxvY2F0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKGFsbG9jKSB7XG4gICAgICBldmVudEJlYWNvbi5lbWl0KCdjb250YW1pbmF0aW9uJywgYXNzaWduKHtcbiAgICAgICAgdWlkOiBhbGxvYy51aWQsXG4gICAgICAgIHNpZDogYWxsb2Muc2lkLFxuICAgICAgICBlaWQ6IGFsbG9jLmVpZCxcbiAgICAgICAgY2lkOiBhbGxvYy5jaWRcbiAgICAgIH0sIGNvbnRleHQucmVtb3RlQ29udGV4dCkpO1xuICAgIH0pO1xuICAgIGV2ZW50QmVhY29uLmZsdXNoKCk7XG4gICAgZW1pdChjb250ZXh0LCBFdm9sdkNsaWVudC5DT05UQU1JTkFURUQpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgY2xpZW50IHdpdGggcmVxdWlyZWQgY29udGV4dCBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHVpZCBBIGdsb2JhbGx5IHVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgY3VycmVudCBwYXJ0aWNpcGFudC5cbiAgICogQHBhcmFtIHtTdHJpbmd9IHNpZCBBIGdsb2JhbGx5IHVuaXF1ZSBzZXNzaW9uIGlkZW50aWZpZXIgZm9yIHRoZSBjdXJyZW50IHBhcnRpY2lwYW50LlxuICAgKiBAcGFyYW0ge09iamVjdH0gcmVtb3RlQ29udGV4dCBBIG1hcCBvZiBkYXRhIHVzZWQgZm9yIGV2YWx1YXRpbmcgY29udGV4dCBwcmVkaWNhdGVzIGFuZCBhbmFseXRpY3MuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBsb2NhbENvbnRleHQgQSBtYXAgb2YgZGF0YSB1c2VkIG9ubHkgZm9yIGV2YWx1YXRpbmcgY29udGV4dCBwcmVkaWNhdGVzLlxuICAgKi9cbiAgdGhpcy5pbml0aWFsaXplID0gZnVuY3Rpb24gKHVpZCwgc2lkLCByZW1vdGVDb250ZXh0LCBsb2NhbENvbnRleHQpIHtcbiAgICBpZiAoaW5pdGlhbGl6ZWQpIHtcbiAgICAgIHRocm93IEVycm9yKCdFdm9sdjogQ2xpZW50IGlzIGFscmVhZHkgaW5pdGlhbGl6ZWQnKTtcbiAgICB9XG5cbiAgICBpZiAoIXVpZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFdm9sdjogXCJ1aWRcIiBtdXN0IGJlIHNwZWNpZmllZCcpO1xuICAgIH1cblxuICAgIGlmICghc2lkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0V2b2x2OiBcInNpZFwiIG11c3QgYmUgc3BlY2lmaWVkJyk7XG4gICAgfVxuXG4gICAgY29udGV4dC5pbml0aWFsaXplKHVpZCwgc2lkLCByZW1vdGVDb250ZXh0LCBsb2NhbENvbnRleHQpO1xuICAgIHN0b3JlLmluaXRpYWxpemUoY29udGV4dCk7XG5cbiAgICB3YWl0Rm9yKGNvbnRleHQsIENPTlRFWFRfSU5JVElBTElaRUQsIGZ1bmN0aW9uKHR5cGUsIGN0eCkge1xuICAgICAgY29udGV4dEJlYWNvbi5lbWl0KHR5cGUsIGNvbnRleHQucmVtb3RlQ29udGV4dCk7XG4gICAgfSk7XG4gICAgd2FpdEZvcihjb250ZXh0LCBDT05URVhUX1ZBTFVFX0FEREVELCBmdW5jdGlvbih0eXBlLCBrZXksIHZhbHVlLCBsb2NhbCkge1xuICAgICAgaWYgKGxvY2FsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29udGV4dEJlYWNvbi5lbWl0KHR5cGUsIHsga2V5OiBrZXksIHZhbHVlOiB2YWx1ZSB9KTtcbiAgICB9KTtcbiAgICB3YWl0Rm9yKGNvbnRleHQsIENPTlRFWFRfVkFMVUVfQ0hBTkdFRCwgZnVuY3Rpb24odHlwZSwga2V5LCB2YWx1ZSwgYmVmb3JlLCBsb2NhbCkge1xuICAgICAgaWYgKGxvY2FsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29udGV4dEJlYWNvbi5lbWl0KHR5cGUsIHsga2V5OiBrZXksIHZhbHVlOiB2YWx1ZSB9KTtcbiAgICB9KTtcbiAgICB3YWl0Rm9yKGNvbnRleHQsIENPTlRFWFRfVkFMVUVfUkVNT1ZFRCwgZnVuY3Rpb24odHlwZSwga2V5LCBsb2NhbCkge1xuICAgICAgaWYgKGxvY2FsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29udGV4dEJlYWNvbi5lbWl0KHR5cGUsIHsga2V5OiBrZXkgfSk7XG4gICAgfSk7XG5cbiAgICBpZiAob3B0aW9ucy5hdXRvQ29uZmlybSkge1xuICAgICAgd2FpdEZvcihFRkZFQ1RJVkVfR0VOT01FX1VQREFURUQsIHRoaXMuY29uZmlybS5iaW5kKHRoaXMpKTtcbiAgICAgIHdhaXRGb3IoUkVRVUVTVF9GQUlMRUQsIHRoaXMuY29udGFtaW5hdGUuYmluZCh0aGlzKSk7XG4gICAgfVxuXG4gICAgaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIGVtaXQoY29udGV4dCwgRXZvbHZDbGllbnQuSU5JVElBTElaRUQsIG9wdGlvbnMpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBGb3JjZSBhbGwgYmVhY29ucyB0byB0cmFuc21pdC5cbiAgICovXG4gIHRoaXMuZmx1c2ggPSBmdW5jdGlvbigpIHtcbiAgICBldmVudEJlYWNvbi5mbHVzaCgpO1xuICAgIGNvbnRleHRCZWFjb24uZmx1c2goKTtcbiAgfTtcblxuICAvKipcbiAgICogRGVzdHJveSB0aGUgY2xpZW50IGFuZCBpdHMgZGVwZW5kZW5jaWVzLlxuICAgKi9cbiAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZmx1c2goKTtcbiAgICBzdG9yZS5kZXN0cm95KCk7XG4gICAgY29udGV4dC5kZXN0cm95KCk7XG4gICAgZGVzdHJveVNjb3BlKGNvbnRleHQpO1xuICB9O1xufVxuXG5Fdm9sdkNsaWVudC5JTklUSUFMSVpFRCA9ICdpbml0aWFsaXplZCc7XG5Fdm9sdkNsaWVudC5DT05GSVJNRUQgPSAnY29uZmlybWVkJztcbkV2b2x2Q2xpZW50LkNPTlRBTUlOQVRFRCA9ICdjb250YW1pbmF0ZWQnO1xuRXZvbHZDbGllbnQuRVZFTlRfRU1JVFRFRCA9ICdldmVudC5lbWl0dGVkJztcblxuZXhwb3J0IGRlZmF1bHQgRXZvbHZDbGllbnQ7XG4iLCJpbXBvcnQgYmFzZTY0YWIgZnJvbSAnYmFzZTY0LWFycmF5YnVmZmVyJztcblxuZXhwb3J0IGRlZmF1bHQge1xuICBlbmNvZGU6IGZ1bmN0aW9uKGJ5dGVzKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBidG9hICE9PSAndW5kZWZpbmVkJyA/IGJ0b2EoYnl0ZXMpIDogQnVmZmVyLmZyb20oYnl0ZXMpLnRvU3RyaW5nKCdiYXNlNjQnKTtcbiAgfSxcbiAgZGVjb2RlOiBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICByZXR1cm4gdHlwZW9mIGF0b2IgIT09ICd1bmRlZmluZWQnID8gYXRvYihzdHJpbmcpIDogQnVmZmVyLmZyb20oc3RyaW5nLCAnYmFzZTY0JykudG9TdHJpbmcoKTtcbiAgfSxcbiAgZW5jb2RlRnJvbUFycmF5QnVmZmVyOiBiYXNlNjRhYi5lbmNvZGUsXG4gIGRlY29kZVRvQXJyYXlCdWZmZXI6IGJhc2U2NGFiLmRlY29kZVxufTtcbiIsImNvbnN0IGludm9rZXIgPSBmdW5jdGlvbihhcmdzLCBmbikge1xuICBmbi5jYWxsKHRoaXMsIGFyZ3MpO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTWluaVByb21pc2Uge1xuICBjb25zdHJ1Y3RvcihleGVjdXRvcikge1xuICAgIHRoaXMuX3Jlc3BvbnNlQXJncyA9IG51bGw7XG4gICAgdGhpcy5fZXJyb3JlZCA9IGZhbHNlO1xuICAgIHRoaXMuX3RoZW5zID0gW107XG4gICAgdGhpcy5fY2F0Y2hlcyA9IFtdO1xuICAgIHRoaXMuX2ZpbmFsbHlzID0gW107XG5cbiAgICBjb25zdCByZXNwb25zZSA9IGZ1bmN0aW9uKGVycm9yZWQsIGhhbmRsZXJzKSB7XG4gICAgICBpZiAodGhpcy5fcmVzcG9uc2VBcmdzKSB7XG4gICAgICAgIHRocm93IEVycm9yKCdSZXNwb25zZSBhbHJlYWR5IHNlbnQnKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgLy8gRHJvcCB0aGUgZXJyb3JlZCBhbmQgaGFuZGxlcnMgYXJndW1lbnRzIGZyb20gdGhlIGJpbmRpbmdcbiAgICAgIGFyZ3Muc2hpZnQoKTtcbiAgICAgIGFyZ3Muc2hpZnQoKTtcbiAgICAgIHRoaXMuX2Vycm9yZWQgPSBlcnJvcmVkO1xuICAgICAgdGhpcy5fcmVzcG9uc2VBcmdzID0gYXJndW1lbnRzO1xuICAgICAgdGhpcy5fY2F0Y2hlcy5mb3JFYWNoKGludm9rZXIuYmluZCh0aGlzLCBhcmd1bWVudHMpKTtcbiAgICAgIHRoaXMuX2ZpbmFsbHlzLmZvckVhY2goaW52b2tlci5iaW5kKHRoaXMsIGFyZ3VtZW50cykpO1xuICAgIH07XG5cbiAgICBjb25zdCByZWplY3QgPSByZXNwb25zZS5iaW5kKHRoaXMsIHRydWUsIHRoaXMuX2NhdGNoZXMpO1xuICAgIGNvbnN0IHJlc29sdmUgPSByZXNwb25zZS5iaW5kKHRoaXMsIGZhbHNlLCB0aGlzLl90aGVucyk7XG5cbiAgICB0cnkge1xuICAgICAgZXhlY3V0b3IocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHJlamVjdChlcnIpO1xuICAgIH1cbiAgfVxuXG4gIHRoZW4oaGFuZGxlcikge1xuICAgIGlmICh0aGlzLl9yZXNwb25zZUFyZ3MgJiYgIXRoaXMuX2Vycm9yZWQpIHtcbiAgICAgIGludm9rZXIuY2FsbCh0aGlzLCB0aGlzLl9yZXNwb25zZUFyZ3MsIGhhbmRsZXIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3RoZW5zLnB1c2goaGFuZGxlcik7XG4gIH1cblxuICBjYXRjaChoYW5kbGVyKSB7XG4gICAgaWYgKHRoaXMuX3Jlc3BvbnNlQXJncyAmJiB0aGlzLl9lcnJvcmVkKSB7XG4gICAgICBpbnZva2VyLmNhbGwodGhpcywgdGhpcy5fcmVzcG9uc2VBcmdzLCBoYW5kbGVyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9jYXRjaGVzLnB1c2goaGFuZGxlcik7XG4gIH1cblxuICBmaW5hbGx5KGhhbmRsZXIpIHtcbiAgICBpZiAodGhpcy5fcmVzcG9uc2VBcmdzKSB7XG4gICAgICBpbnZva2VyLmNhbGwodGhpcywgdGhpcy5fcmVzcG9uc2VBcmdzLCBoYW5kbGVyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9maW5hbGx5cy5wdXNoKGhhbmRsZXIpO1xuICB9XG59XG5cbk1pbmlQcm9taXNlLmNyZWF0ZVByb21pc2UgPSBmdW5jdGlvbiAoZXhlY3V0b3IpIHtcbiAgcmV0dXJuIG5ldyAodHlwZW9mIFByb21pc2UgIT09ICd1bmRlZmluZWQnID8gUHJvbWlzZSA6IE1pbmlQcm9taXNlKShleGVjdXRvcik7XG59O1xuIiwiaW1wb3J0IGRlZXBtZXJnZSBmcm9tICdkZWVwbWVyZ2UnO1xuXG5leHBvcnQgY29uc3QgZGVlcE1lcmdlID0gZGVlcG1lcmdlO1xuZXhwb3J0IGZ1bmN0aW9uIGRlZXBDbG9uZShvYmopIHtcbiAgcmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkob2JqKSk7XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgYSB2YXJpYWJsZSBpcyBhbiBPYmplY3QuIFRoaXMgZnVuY3Rpb24gY29uc2lkZXJzIE51bGwgYW5kIEFycmF5IHRvIG5vdCBiZSBPYmplY3RzLlxuICpcbiAqIEBwYXJhbSB2YXJpYWJsZSBUaGUgdmFyaWFibGUgdGhhdCBpcyB0byB0ZXN0ZWRcbiAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHRoZSB2YXJpYWJsZSBpcyBhbiBvYmplY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzT2JqZWN0KHZhcmlhYmxlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFyaWFibGUgPT09ICdvYmplY3QnICYmIHZhcmlhYmxlICE9PSBudWxsICYmICFBcnJheS5pc0FycmF5KHZhcmlhYmxlKTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0IGEgaGllcmFyY2hpY2FsIG1hcCBpbnRvIGEgZmxhdHRlbmVkIG1hcFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBtYXAgQSBtYXAgd2l0aCBoaWVyYXJjaGljYWwga2V5c1xuICogQHJldHVybnMge09iamVjdH0gQSBtYXAgd2l0aCBoaWVyYXJjaGljYWwga2V5cyBmbGF0dGVuZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZsYXR0ZW4obWFwLCBmaWx0ZXIpIHtcbiAgZnVuY3Rpb24gcmVjdXJzZShjdXJyZW50LCBwYXJlbnRfa2V5KSB7XG4gICAgbGV0IGl0ZW1zID0ge307XG4gICAgT2JqZWN0LmtleXMoY3VycmVudCkuZmlsdGVyKGZpbHRlciB8fCBmdW5jdGlvbigpIHsgcmV0dXJuIHRydWU7IH0pLmZvckVhY2goZnVuY3Rpb24oaykge1xuICAgICAgbGV0IHYgPSBjdXJyZW50W2tdO1xuICAgICAgbGV0IG5ld19rZXkgPSBwYXJlbnRfa2V5ID8gKHBhcmVudF9rZXkgKyAnLicgKyBrKSA6IGs7XG4gICAgICBpZiAoaXNPYmplY3QodikpIHtcbiAgICAgICAgaXRlbXMgPSBhc3NpZ24oaXRlbXMsIHJlY3Vyc2UoY3VycmVudFtrXSwgbmV3X2tleSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaXRlbXNbbmV3X2tleV0gPSB2O1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGl0ZW1zO1xuICB9XG5cbiAgcmV0dXJuIHJlY3Vyc2UobWFwLCAnJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmbGF0dGVuS2V5cyhtYXAsIGZpbHRlcikge1xuICBmdW5jdGlvbiByZWN1cnNlKGN1cnJlbnQsIHBhcmVudF9rZXkpIHtcbiAgICBsZXQgaXRlbXMgPSBbXTtcbiAgICBPYmplY3Qua2V5cyhjdXJyZW50KS5maWx0ZXIoZmlsdGVyIHx8IGZ1bmN0aW9uKCkgeyByZXR1cm4gdHJ1ZTsgfSkuZm9yRWFjaChmdW5jdGlvbihrKSB7XG4gICAgICBsZXQgdiA9IGN1cnJlbnRba107XG4gICAgICBsZXQgbmV3X2tleSA9IHBhcmVudF9rZXkgPyAocGFyZW50X2tleSArICcuJyArIGspIDogaztcbiAgICAgIGl0ZW1zLnB1c2gobmV3X2tleSk7XG4gICAgICBpZiAoaXNPYmplY3QodikpIHtcbiAgICAgICAgaXRlbXMgPSBpdGVtcy5jb25jYXQocmVjdXJzZShjdXJyZW50W2tdLCBuZXdfa2V5KSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gaXRlbXM7XG4gIH1cblxuICByZXR1cm4gcmVjdXJzZShtYXAsICcnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZVZhbHVlRm9yS2V5KGtleSwgbWFwKSB7XG4gIGZ1bmN0aW9uIHJlY3Vyc2Uoa2V5cywgaW5kZXgsIG1hcCkge1xuICAgIGxldCBrZXkgPSBrZXlzW2luZGV4XTtcbiAgICBpZiAoaW5kZXggPT09IChrZXlzLmxlbmd0aCAtIDEpKSB7XG4gICAgICBkZWxldGUgbWFwW2tleV07XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoIShrZXkgaW4gbWFwKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChyZWN1cnNlKGtleXMsIGluZGV4ICsgMSwgbWFwW2tleV0pICYmIE9iamVjdC5rZXlzKG1hcFtrZXldKS5sZW5ndGggPT09IDApIHtcbiAgICAgIGRlbGV0ZSBtYXBba2V5XTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZWN1cnNlKGtleS5zcGxpdCgnLicpLCAwLCBtYXApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VmFsdWVGb3JLZXkoa2V5LCBtYXApIHtcbiAgbGV0IHZhbHVlO1xuICBsZXQgY3VycmVudCA9IG1hcDtcbiAgbGV0IGtleXMgPSBrZXkuc3BsaXQoJy4nKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGsgPSBrZXlzW2ldO1xuICAgIGlmIChpID09PSAoa2V5cy5sZW5ndGggLSAxKSkge1xuICAgICAgdmFsdWUgPSBjdXJyZW50W2tdO1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKCEoayBpbiBjdXJyZW50KSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY3VycmVudCA9IGN1cnJlbnRba107XG4gIH1cblxuICByZXR1cm4gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRLZXlUb1ZhbHVlKGtleSwgdmFsdWUsIG1hcCkge1xuICBsZXQgY3VycmVudCA9IG1hcDtcbiAgbGV0IGtleXMgPSBrZXkuc3BsaXQoJy4nKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGsgPSBrZXlzW2ldO1xuICAgIGlmIChpID09PSAoa2V5cy5sZW5ndGggLSAxKSkge1xuICAgICAgY3VycmVudFtrXSA9IHZhbHVlO1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKCEoayBpbiBjdXJyZW50KSkge1xuICAgICAgY3VycmVudFtrXSA9IHt9O1xuICAgIH1cblxuICAgIGN1cnJlbnQgPSBjdXJyZW50W2tdO1xuICB9XG5cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIENvbnZlcnQgYSBmbGF0dGVuZWQgbWFwIGludG8gYSBoaWVyYXJjaGljYWwgbWFwXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG1hcCBBIG1hcCB3aXRoIGhpZXJhcmNoaWNhbCBrZXlzIGZsYXR0ZW5lZFxuICogQHJldHVybnMge09iamVjdH0gQSBtYXAgd2l0aCBoaWVyYXJjaGljYWwga2V5c1xuICovXG5leHBvcnQgZnVuY3Rpb24gZXhwYW5kKG1hcCkge1xuICBsZXQgZXhwYW5kZWQgPSB7fTtcbiAgT2JqZWN0LmtleXMobWFwKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGxldCB2ID0gbWFwW2tleV07XG4gICAgc2V0S2V5VG9WYWx1ZShrZXksIHYsIGV4cGFuZGVkKTtcbiAgfSk7XG5cbiAgcmV0dXJuIGV4cGFuZGVkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyKG1hcCwgYWN0aXZlKSB7XG4gIGNvbnN0IGZsYXR0ZW5lZCA9IGZsYXR0ZW4obWFwKTtcbiAgY29uc3QgZmlsdGVyZWQgPSB7fTtcbiAgYWN0aXZlLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKGtleSBpbiBmbGF0dGVuZWQpIHtcbiAgICAgIGZpbHRlcmVkW2tleV0gPSBmbGF0dGVuZWRba2V5XTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBleHBhbmQoZmlsdGVyZWQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzaWduKHRhcmdldCwgc291cmNlcykge1xuICBpZiAoT2JqZWN0LmFzc2lnbikge1xuICAgIHJldHVybiBPYmplY3QuYXNzaWduLmFwcGx5KHVuZGVmaW5lZCwgYXJndW1lbnRzKTtcbiAgfVxuXG4gIGlmICh0YXJnZXQgPT09IG51bGwgfHwgdGFyZ2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY29udmVydCB1bmRlZmluZWQgb3IgbnVsbCB0byBvYmplY3QnKTtcbiAgfVxuXG4gIGNvbnN0IHRvID0gT2JqZWN0KHRhcmdldCk7XG5cbiAgZm9yIChsZXQgaW5kZXggPSAxOyBpbmRleCA8IGFyZ3VtZW50cy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICBsZXQgbmV4dFNvdXJjZSA9IGFyZ3VtZW50c1tpbmRleF07XG5cbiAgICBpZiAobmV4dFNvdXJjZSAhPT0gbnVsbCAmJiBuZXh0U291cmNlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGZvciAobGV0IG5leHRLZXkgaW4gbmV4dFNvdXJjZSkge1xuICAgICAgICAvLyBBdm9pZCBidWdzIHdoZW4gaGFzT3duUHJvcGVydHkgaXMgc2hhZG93ZWRcbiAgICAgICAgaWYgKG5leHRTb3VyY2UuaGFzT3duUHJvcGVydHkobmV4dEtleSkpIHtcbiAgICAgICAgICB0b1tuZXh0S2V5XSA9IG5leHRTb3VyY2VbbmV4dEtleV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdG87XG59XG4iLCJpbXBvcnQgYmFzZTY0IGZyb20gJy4vcG9ueWZpbGxzL2Jhc2U2NC5qcyc7XG5cbmNvbnN0IEFORCA9ICdhbmQnO1xuY29uc3QgT1IgPSAnb3InO1xuXG5jb25zdCBGSUxURVJfT1BFUkFUT1JTID0ge1xuICBjb250YWluczogZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYS5pbmRleE9mKGIpID49IDA7IH0sXG4gIGVxdWFsOiBmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhID09PSBiOyB9LFxuICBleGlzdHM6IGZ1bmN0aW9uKGEpIHsgcmV0dXJuIGEgIT09IG51bGw7IH0sIC8vIENoZWNrIHRoYXQgdGhlIGtleSBleGlzdHMgaW4gdGhlIGRpY3Rpb25hcnkgb2JqZWN0XG4gIG5vdF9jb250YWluczogZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gIShhLmluZGV4T2YoYikgPj0gMCk7IH0sXG4gIG5vdF9lcXVhbDogZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSAhPT0gYjsgfSxcbiAgbm90X3JlZ2V4X21hdGNoOiBmdW5jdGlvbih2YWx1ZSwgcGF0dGVybikgeyByZXR1cm4gdmFsdWUgJiYgIXZhbHVlLm1hdGNoKHBhdHRlcm4pOyB9LFxuICBub3RfcmVnZXg2NF9tYXRjaDogZnVuY3Rpb24odmFsdWUsIHBhdHRlcm4pIHsgcmV0dXJuICFyZWdleDY0TWF0Y2godmFsdWUsIHBhdHRlcm4pIH0sXG4gIG5vdF9zdGFydHNfd2l0aDogZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gIWEuc3RhcnRzV2l0aChiKTsgfSxcbiAga3ZfY29udGFpbnM6IGZ1bmN0aW9uKG9iaiwgcGFyYW1zKSB7IHJldHVybiAocGFyYW1zWzBdIGluIG9iaikgJiYgKG9ialtwYXJhbXNbMF1dLmluZGV4T2YocGFyYW1zWzFdKSA+PSAwKSB9LFxuICBrdl9lcXVhbDogZnVuY3Rpb24ob2JqLCBwYXJhbXMpIHsgcmV0dXJuIG9ialtwYXJhbXNbMF1dID09PSBwYXJhbXNbMV07IH0sXG4gIGt2X25vdF9jb250YWluczogZnVuY3Rpb24ob2JqLCBwYXJhbXMpIHsgcmV0dXJuICEoKHBhcmFtc1swXSBpbiBvYmopICYmIChvYmpbcGFyYW1zWzBdXS5pbmRleE9mKHBhcmFtc1sxXSkgPj0gMCkpOyB9LFxuICBrdl9ub3RfZXF1YWw6IGZ1bmN0aW9uKG9iaiwgcGFyYW1zKSB7IHJldHVybiBvYmpbcGFyYW1zWzBdXSAhPT0gcGFyYW1zWzFdOyB9LFxuICByZWdleF9tYXRjaDogZnVuY3Rpb24odmFsdWUsIHBhdHRlcm4pIHsgcmV0dXJuIHZhbHVlICYmIHZhbHVlLm1hdGNoKHBhdHRlcm4pOyB9LFxuICByZWdleDY0X21hdGNoOiByZWdleDY0TWF0Y2gsXG4gIHN0YXJ0c193aXRoOiBmdW5jdGlvbihhLCBiKXsgcmV0dXJuIGEuc3RhcnRzV2l0aChiKTsgfVxufTtcblxuZnVuY3Rpb24gcmVnZXhGcm9tU3RyaW5nIChzdHJpbmcpIHtcbiAgaWYgKCFzdHJpbmcuc3RhcnRzV2l0aCgnLycpKSB7XG4gICAgcmV0dXJuIG5ldyBSZWdFeHAoc3RyaW5nKTtcbiAgfVxuXG4gIGNvbnN0IHNwbGl0ID0gc3RyaW5nLmxhc3RJbmRleE9mKCcvJyk7XG4gIHJldHVybiBuZXcgUmVnRXhwKHN0cmluZy5zdWJzdHJpbmcoMSwgc3BsaXQpLCBzdHJpbmcuc3Vic3RyaW5nKHNwbGl0ICsgMSkpO1xufVxuXG5mdW5jdGlvbiByZWdleDY0TWF0Y2godmFsdWUsIGI2NHBhdHRlcm4pIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBzdHJpbmcgPSBiYXNlNjQuZGVjb2RlKGI2NHBhdHRlcm4pO1xuICAgIHJldHVybiB2YWx1ZSAmJiB2YWx1ZS5tYXRjaChyZWdleEZyb21TdHJpbmcoc3RyaW5nKSkgIT09IG51bGw7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuZnVuY3Rpb24gdmFsdWVGcm9tS2V5KGNvbnRleHQsIGtleSkge1xuICBpZiAoY29udGV4dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGNvbnN0IG5leHRUb2tlbiA9IGtleS5pbmRleE9mKCcuJyk7XG4gIGlmIChuZXh0VG9rZW4gPT09IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgdmFyaWFudCBrZXk6ICcgKyBrZXkpO1xuICB9XG5cbiAgaWYgKG5leHRUb2tlbiA9PT0gLTEpIHtcbiAgICByZXR1cm4ga2V5IGluIGNvbnRleHQgPyBjb250ZXh0W2tleV0gOiB1bmRlZmluZWQ7XG4gIH1cblxuICByZXR1cm4gdmFsdWVGcm9tS2V5KGNvbnRleHRba2V5LnN1YnN0cmluZygwLCBuZXh0VG9rZW4pXSwga2V5LnN1YnN0cmluZyhuZXh0VG9rZW4gKyAxKSk7XG59XG5cbmZ1bmN0aW9uIGV2YWx1YXRlRmlsdGVyKHVzZXIsIHJ1bGUpIHtcbiAgY29uc3QgdmFsdWUgPSB2YWx1ZUZyb21LZXkodXNlciwgcnVsZS5maWVsZCk7XG5cbiAgaWYgKHJ1bGUub3BlcmF0b3Iuc3RhcnRzV2l0aCgna3ZfJykgJiYgIXZhbHVlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gRXZhbHVhdGVzIGEgc2luZ2xlIGZpbHRlciBydWxlIGFnYWluc3QgYSB1c2VyLlxuICByZXR1cm4gISFGSUxURVJfT1BFUkFUT1JTW3J1bGUub3BlcmF0b3JdKHZhbHVlLCBydWxlLnZhbHVlKTtcbn1cblxuXG5mdW5jdGlvbiBldmFsdWF0ZVJ1bGUodXNlciwgcXVlcnksIHJ1bGUsIHBhc3NlZFJ1bGVzLCBmYWlsZWRSdWxlcykge1xuICBsZXQgcmVzdWx0O1xuICBpZiAoJ2NvbWJpbmF0b3InIGluIHJ1bGUpIHtcbiAgICAvLyBObyBuZWVkIHRvIGFkZCBncm91cHMgdG8gcGFzcy9mYWlsZWQgcnVsZSBzZXRzIGhlcmUuIFRoZWlyIGNoaWxkcmVuIHJlc3VsdHMgd2lsbCBiZSBtZXJnZWQgdXBcbiAgICAvLyB2aWEgcmVjdXJzaW9uLlxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11c2UtYmVmb3JlLWRlZmluZVxuICAgIHJldHVybiBldmFsdWF0ZVByZWRpY2F0ZSh1c2VyLCBydWxlLCBwYXNzZWRSdWxlcywgZmFpbGVkUnVsZXMpO1xuICB9IGVsc2Uge1xuICAgIHJlc3VsdCA9IGV2YWx1YXRlRmlsdGVyKHVzZXIsIHJ1bGUpO1xuICB9XG5cbiAgLy8gQW55IG90aGVyIHJ1bGUgaXMgYWxzbyBhIHRlcm1pbmF0aW5nIGJyYW5jaCBpbiBvdXIgcmVjdXJzaW9uIHRyZWUsIHNvIHdlIGFkZCBydWxlIGlkIHRvIHBhc3MvZmFpbCBydWxlIHNldFxuICAocmVzdWx0ID8gcGFzc2VkUnVsZXMgOiBmYWlsZWRSdWxlcykuYWRkKHtcbiAgICBpZDogcXVlcnkuaWQsXG4gICAgaW5kZXg6IHJ1bGUuaW5kZXgsXG4gICAgZmllbGQ6IHJ1bGUuZmllbGRcbiAgfSk7XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuXG5mdW5jdGlvbiBldmFsdWF0ZVByZWRpY2F0ZSh1c2VyLCBxdWVyeSwgcGFzc2VkUnVsZXMsIGZhaWxlZFJ1bGVzKSB7XG4gIGNvbnN0IHsgcnVsZXMgfSA9IHF1ZXJ5O1xuXG4gIGlmICghcnVsZXMpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcnVsZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBwYXNzZWQgPSBldmFsdWF0ZVJ1bGUodXNlciwgcXVlcnksIHJ1bGVzW2ldLCBwYXNzZWRSdWxlcywgZmFpbGVkUnVsZXMpO1xuICAgIGlmIChwYXNzZWQgJiYgcXVlcnkuY29tYmluYXRvciA9PT0gT1IpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmICghcGFzc2VkICYmIHF1ZXJ5LmNvbWJpbmF0b3IgPT09IEFORCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8vIElmIHdlJ3ZlIHJlYWNoZWQgdGhpcyBwb2ludCBvbiBhbiAnb3InIGFsbCBydWxlcyBmYWlsZWQuXG4gIHJldHVybiBxdWVyeS5jb21iaW5hdG9yID09PSBBTkQ7XG59XG5cblxuLyoqXG5FdmFsdWF0ZXMgYSBxdWVyeSBhZ2FpbnN0IGEgdXNlciBvYmplY3QgYW5kIHNhdmVzIHBhc3NpbmcvZmFpbGluZyBydWxlIGlkcyB0byBwcm92aWRlZCBzZXRzLlxuXG4gIEBwYXJhbSBjb250ZXh0IEEgY29udGV4dCBvYmplY3QgY29udGFpbmluZyBkZXNjcmliaW5nIHRoZSBjb250ZXh0IHRoZSBwcmVkaWNhdGUgc2hvdWxkIGJlIGV2YWx1YXRlZCBhZ2FpbnN0LlxuICBAcGFyYW0gcHJlZGljYXRlIE5lc3RlZCBwcmVkaWNhdGUgb2JqZWN0IHRoYXQgcnVsZXMgc3RydWN0dXJlZCBpbnRvIGdyb3VwcyBhcyBhIGRlZXBseSBuZXN0ZWQgdHJlZS5cbiAgICAgICAgICAgICAgIG5vdGU6IFRoZXJlIGlzIG5vIHNldCBsaW1pdCB0byB0aGUgZGVwdGggb2YgdGhpcyB0cmVlLCBoZW5jZSB3ZSBtdXN0IHdvcmsgd2l0aCBpdFxuICAgICAgICAgICAgICAgdXNpbmcgcmVjdXJzaW9uLlxuKi9cbmV4cG9ydCBmdW5jdGlvbiBldmFsdWF0ZShjb250ZXh0LCBwcmVkaWNhdGUpIHtcbiAgY29uc3QgcmVzdWx0ID0ge1xuICAgIHBhc3NlZDogbmV3IFNldCgpLFxuICAgIGZhaWxlZDogbmV3IFNldCgpXG4gIH07XG5cbiAgcmVzdWx0LnJlamVjdGVkID0gIWV2YWx1YXRlUHJlZGljYXRlKGNvbnRleHQsIHByZWRpY2F0ZSwgcmVzdWx0LnBhc3NlZCwgcmVzdWx0LmZhaWxlZCk7XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cbiIsImltcG9ydCBNaW5pUHJvbWlzZSBmcm9tICcuL3BvbnlmaWxscy9taW5pcHJvbWlzZS5qcyc7XG5pbXBvcnQgYmFzZTY0IGZyb20gJy4vcG9ueWZpbGxzL2Jhc2U2NC5qcyc7XG5pbXBvcnQgeyBhc3NpZ259IGZyb20gJy4vcG9ueWZpbGxzL29iamVjdHMuanMnO1xuXG5jb25zdCBVUkxfUEFUVEVSTiA9IC9eKFthLXpdKyk6XFwvXFwvKFteL10rKSguKikvaTtcblxuZnVuY3Rpb24gY3J5cHRvZ3JhcGh5KCkge1xuICByZXR1cm4gdHlwZW9mIGNyeXB0byAhPT0gJ3VuZGVmaW5lZCcgPyBjcnlwdG8gOiBtc0NyeXB0bztcbn1cblxuLyoqXG4gKiBDb252ZXJ0IGEgU3RyaW5nIHRvIGFuIEFycmF5QnVmZmVyXG4gKlxuICogaWUxMSBTdXBwb3J0ZWRcbiAqXG4gKiBAcGFyYW0gc3RyIFRoZSBTdHJpbmcgdG8gY29udmVydCB0byBhbiBBcnJheUJ1ZmZlclxuICogQHJldHVybnMge0FycmF5QnVmZmVyfSBUaGUgcmVzdWx0aW5nIGFycmF5IGJ1ZmZlciBlbmNvZGVkIGFzIHV0Zi04XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdHIyYWIoc3RyKSB7XG4gIGlmICh0eXBlb2YgVGV4dEVuY29kZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIChuZXcgVGV4dEVuY29kZXIoKSkuZW5jb2RlKHN0cikuYnVmZmVyO1xuICB9XG5cbiAgY29uc3QgYnVmID0gbmV3IEFycmF5QnVmZmVyKHN0ci5sZW5ndGgpO1xuICBjb25zdCBidWZWaWV3ID0gbmV3IFVpbnQ4QXJyYXkoYnVmKTtcbiAgZm9yIChsZXQgaSA9IDAsIHN0ckxlbiA9IHN0ci5sZW5ndGg7IGkgPCBzdHJMZW47IGkrKykge1xuICAgIGJ1ZlZpZXdbaV0gPSBzdHIuY2hhckNvZGVBdChpKTtcbiAgfVxuICByZXR1cm4gYnVmO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGFuIG1zQ3J5cHRvIG9wZXJhdGlvbiB0byBhIHByb21pc2UgaWYgbmVlZGVkLlxuICpcbiAqIEBwYXJhbSBvcCBUaGUgb3AgKG9yIFByb21pc2UpIHRvIGNvbnZlcnQgaWYgbmVlZGVkLlxuICogQHJldHVybnMge3tQcm9taXNlTGlrZX0gQSBwcm9taXNlXG4gKi9cbmZ1bmN0aW9uIGNyeXB0b09wZXJhdGlvblRvUHJvbWlzZShvcCkge1xuICBpZiAob3AudGhlbikge1xuICAgIHJldHVybiBvcDtcbiAgfVxuXG4gIHJldHVybiBNaW5pUHJvbWlzZS5jcmVhdGVQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIG9wLm9uY29tcGxldGUgPSBmdW5jdGlvbihldnQpIHtcbiAgICAgIHJlc29sdmUoZXZ0LnRhcmdldC5yZXN1bHQpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiByZWplY3RIYW5kbGVyKGV2dCkge1xuICAgICAgcmVqZWN0KGV2dC50b1N0cmluZygpKTtcbiAgICB9XG4gICAgb3Aub25lcnJvciA9IHJlamVjdEhhbmRsZXI7XG4gICAgb3Aub25hYm9ydCA9IHJlamVjdEhhbmRsZXI7XG4gIH0pO1xufVxuXG4vKipcbiAqIFNpZ24gYSBTdHJpbmcgd2l0aCBITUFDLVNIQTM4NFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXkgVGhlIEhNQUMga2V5IHRvIHVzZSBmb3Igc2lnbmluZ1xuICogQHBhcmFtIHtTdHJpbmd9IHBheWxvYWQgVGhlIFN0cmluZyB0byBzaWduXG4gKiBAcmV0dXJucyB7UHJvbWlzZUxpa2U8QXJyYXlCdWZmZXI+fSBUaGUgY3J5cHRvZ3JhcGhpYyBzaWduYXR1cmVcbiAqL1xuZnVuY3Rpb24gc2lnbihrZXksIHBheWxvYWQpIHtcbiAgY29uc3Qga2V5Rm9ybWF0ID0gJ3Jhdyc7XG4gIGNvbnN0IGFsZ29yaXRobSA9IHsgbmFtZTogJ0hNQUMnLCBoYXNoOiAnU0hBLTM4NCcgfTtcbiAgY29uc3Qga2V5VXNhZ2VzID0gWydzaWduJ107XG4gIGNvbnN0IGNyeXB0byA9IGNyeXB0b2dyYXBoeSgpO1xuXG4gIHJldHVybiBNaW5pUHJvbWlzZS5jcmVhdGVQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIGNyeXB0b09wZXJhdGlvblRvUHJvbWlzZShjcnlwdG8uc3VidGxlLmltcG9ydEtleShrZXlGb3JtYXQsIHN0cjJhYihrZXkpLCBhbGdvcml0aG0sIHRydWUsIGtleVVzYWdlcykpXG4gICAgICAudGhlbihmdW5jdGlvbiAoY3J5cHRvS2V5KSB7XG4gICAgICAgIGNyeXB0b09wZXJhdGlvblRvUHJvbWlzZShjcnlwdG8uc3VidGxlLnNpZ24oYWxnb3JpdGhtLCBjcnlwdG9LZXksIHBheWxvYWQpKVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKGJ5dGVzKSB7XG4gICAgICAgICAgICByZXNvbHZlKGJhc2U2NC5lbmNvZGVGcm9tQXJyYXlCdWZmZXIoYnl0ZXMpKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChyZWplY3QpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChyZWplY3QpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlU2lnbmF0dXJlSGVhZGVyKHNpZ25hdHVyZUtleUlkLCBzaWduYXR1cmUpIHtcbiAgcmV0dXJuICdrZXlJZD1cIicgKyBzaWduYXR1cmVLZXlJZCArICdcIixhbGdvcml0aG09XCJobWFjLXNoYTM4NFwiLHNpZ25hdHVyZT1cIicgKyBzaWduYXR1cmUgKyAnXCInO1xufVxuXG5mdW5jdGlvbiB4aHJSZXF1ZXN0KG9wdGlvbnMpIHtcbiAgcmV0dXJuIE1pbmlQcm9taXNlLmNyZWF0ZVByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgY29uc3QgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgeGhyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcy5zdGF0dXMgPj0gNDAwKSB7XG4gICAgICAgIHJlamVjdCh0aGlzLnN0YXR1c1RleHQgfHwgKCdFdm9sdjogUmVxdWVzdCBmYWlsZWQgJyArIHRoaXMuc3RhdHVzKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgcmVzb2x2ZShKU09OLnBhcnNlKHRoaXMucmVzcG9uc2VUZXh0KSk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdHVzID09PSAyMDIpIHtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXZvbHY6IEludmFsaWQgc3RhdHVzICcgKyB0aGlzLnN0YXR1cyArICcgZm9yIHJlc3BvbnNlICcgKyB0aGlzLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgIHJlamVjdChtc2cpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHhoci5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIHJlamVjdCk7XG4gICAgeGhyLm9wZW4ob3B0aW9ucy5tZXRob2QsIG9wdGlvbnMudXJsLCBvcHRpb25zLnN5bmMpO1xuICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdBY2NlcHQnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgIGlmIChvcHRpb25zLnNpZ25hdHVyZSkge1xuICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ1NpZ25hdHVyZScsIGNyZWF0ZVNpZ25hdHVyZUhlYWRlcihvcHRpb25zLmtleUlkLCBvcHRpb25zLnNpZ25hdHVyZSkpO1xuICAgIH1cbiAgICB4aHIuc2VuZChvcHRpb25zLnBheWxvYWQpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gbm9kZVJlcXVlc3Qob3B0aW9ucykge1xuICByZXR1cm4gTWluaVByb21pc2UuY3JlYXRlUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICBjb25zdCBwYXJ0cyA9IFVSTF9QQVRURVJOLmV4ZWMob3B0aW9ucy51cmwpO1xuICAgIGlmICghcGFydHMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRXZvbHY6IEludmFsaWQgZW5kcG9pbnQgVVJMJyk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2NoZW1hID0gcGFydHNbMV07XG4gICAgKHNjaGVtYSA9PT0gJ2h0dHAnID8gaW1wb3J0KCdodHRwJykgOiBpbXBvcnQoJ2h0dHBzJykpLnRoZW4oZnVuY3Rpb24gKGh0dHApIHtcbiAgICAgIGNvbnN0IGhvc3RuYW1lID0gcGFydHNbMl07XG4gICAgICBjb25zdCBwYXRoID0gcGFydHNbM107XG4gICAgICBjb25zdCBoZWFkZXJzID0ge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb247Y2hhcnNldD1VVEYtOCcsXG4gICAgICAgICdBY2NlcHQnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICdDb250ZW50LUxlbmd0aCc6IEJ1ZmZlci5ieXRlTGVuZ3RoKG9wdGlvbnMucGF5bG9hZClcbiAgICAgIH07XG5cbiAgICAgIGlmIChvcHRpb25zLnNpZ25hdHVyZSkge1xuICAgICAgICBoZWFkZXJzWydTaWduYXR1cmUnXSA9IGNyZWF0ZVNpZ25hdHVyZUhlYWRlcihvcHRpb25zLmtleUlkLCBvcHRpb25zLnNpZ25hdHVyZSk7XG4gICAgICB9XG4gICAgICBjb25zdCByZXEgPSBodHRwLnJlcXVlc3Qoe1xuICAgICAgICBob3N0bmFtZTogaG9zdG5hbWUsXG4gICAgICAgIHBhdGg6IHBhdGgsXG4gICAgICAgIG1ldGhvZDogb3B0aW9ucy5tZXRob2QsXG4gICAgICAgIGhlYWRlcnM6IGhlYWRlcnNcbiAgICAgIH0sIGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgcmVzLm9uKCdkYXRhJywgcmVzb2x2ZSk7XG4gICAgICB9KTtcbiAgICAgIHJlcS5vbignZXJyb3InLCByZWplY3QpO1xuICAgICAgcmVxLndyaXRlKG9wdGlvbnMucGF5bG9hZCk7XG4gICAgICByZXEuZW5kKCk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiByZXRyaWV2ZShvcHRpb25zKSB7XG4gIHJldHVybiBNaW5pUHJvbWlzZS5jcmVhdGVQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIGxldCBwYXlsb2FkO1xuICAgIGlmICghb3B0aW9ucy5kYXRhKSB7XG4gICAgICBwYXlsb2FkID0gJyc7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygb3B0aW9ucy5kYXRhID09PSAnb2JqZWN0Jykge1xuICAgICAgcGF5bG9hZCA9IEpTT04uc3RyaW5naWZ5KG9wdGlvbnMuZGF0YSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBheWxvYWQgPSBvcHRpb25zLmRhdGE7XG4gICAgfVxuICAgIG9wdGlvbnMgPSBhc3NpZ24oeyBwYXlsb2FkOiAgcGF5bG9hZCB9LCBvcHRpb25zKTtcblxuICAgIGxldCByeDtcbiAgICBpZiAodHlwZW9mIFhNTEh0dHBSZXF1ZXN0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgcnggPSB4aHJSZXF1ZXN0O1xuICAgIH0gZWxzZSB7XG4gICAgICByeCA9IG5vZGVSZXF1ZXN0O1xuICAgIH1cblxuICAgIGlmICghb3B0aW9ucy5rZXkpIHtcbiAgICAgIHJ4KG9wdGlvbnMpXG4gICAgICAgIC50aGVuKHJlc29sdmUpXG4gICAgICAgIC5jYXRjaChyZWplY3QpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNpZ24ob3B0aW9ucy5rZXksIHN0cjJhYihvcHRpb25zLnBheWxvYWQpKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKHNpZ25hdHVyZSkge1xuICAgICAgICByeChhc3NpZ24oe3NpZ25hdHVyZTpzaWduYXR1cmV9LCBvcHRpb25zKSlcbiAgICAgICAgICAudGhlbihyZXNvbHZlKVxuICAgICAgICAgIC5jYXRjaChyZWplY3QpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChyZWplY3QpO1xuICB9KTtcbn1cbiIsImltcG9ydCBNaW5pUHJvbWlzZSBmcm9tICcuL3BvbnlmaWxscy9taW5pcHJvbWlzZS5qcyc7XG5pbXBvcnQgKiBhcyBvYmplY3RzIGZyb20gJy4vcG9ueWZpbGxzL29iamVjdHMuanMnO1xuXG5pbXBvcnQgeyBldmFsdWF0ZSB9IGZyb20gJy4vcHJlZGljYXRlcy5qcyc7XG5pbXBvcnQgeyB3YWl0Rm9yLCBlbWl0IH0gZnJvbSAnLi93YWl0Zm9yaXQuanMnO1xuaW1wb3J0IHsgQ09OVEVYVF9DSEFOR0VEIH0gZnJvbSAnLi9jb250ZXh0LmpzJztcbmltcG9ydCByZXRyaWV2ZSBmcm9tICcuL3JldHJpZXZlLmpzJztcblxuY29uc3QgQ09ORklHX1NPVVJDRSA9ICdjb25maWcnO1xuY29uc3QgR0VOT01FX1NPVVJDRSA9ICdnZW5vbWUnO1xuXG5leHBvcnQgY29uc3QgR0VOT01FX1JFUVVFU1RfU0VOVCA9ICdnZW5vbWUucmVxdWVzdC5zZW50JztcbmV4cG9ydCBjb25zdCBDT05GSUdfUkVRVUVTVF9TRU5UID0gJ2NvbmZpZy5yZXF1ZXN0LnNlbnQnO1xuZXhwb3J0IGNvbnN0IEdFTk9NRV9SRVFVRVNUX1JFQ0VJVkVEID0gJ2dlbm9tZS5yZXF1ZXN0LnJlY2VpdmVkJztcbmV4cG9ydCBjb25zdCBDT05GSUdfUkVRVUVTVF9SRUNFSVZFRCA9ICdjb25maWcucmVxdWVzdC5yZWNlaXZlZCc7XG5leHBvcnQgY29uc3QgUkVRVUVTVF9GQUlMRUQgPSAncmVxdWVzdC5mYWlsZWQnO1xuZXhwb3J0IGNvbnN0IEdFTk9NRV9VUERBVEVEID0gJ2dlbm9tZS51cGRhdGVkJztcbmV4cG9ydCBjb25zdCBDT05GSUdfVVBEQVRFRCA9ICdjb25maWcudXBkYXRlZCc7XG5leHBvcnQgY29uc3QgRUZGRUNUSVZFX0dFTk9NRV9VUERBVEVEID0gJ2VmZmVjdGl2ZS5nZW5vbWUudXBkYXRlZCc7XG5leHBvcnQgY29uc3QgU1RPUkVfREVTVFJPWUVEID0gJ3N0b3JlLmRlc3Ryb3llZCc7XG5cbmZ1bmN0aW9uIG1vdmVLZXlzKGtleXMsIGZyb20sIHRvKSB7XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBmcm9tLmRlbGV0ZShrZXkpO1xuICAgIHRvLmFkZChrZXkpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gd3JhcExpc3RlbmVyKGxpc3RlbmVyKSB7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICB0cnkge1xuICAgICAgbGlzdGVuZXIuYXBwbHkodW5kZWZpbmVkLCBhcmd1bWVudHMpXG4gICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgIGNvbnNvbGUubG9nKGV4KTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIGdldFZhbHVlKGtleSwgZ2Vub21lKSB7XG4gIHJldHVybiBvYmplY3RzLmdldFZhbHVlRm9yS2V5KGtleSwgZ2Vub21lKTtcbn1cblxuZnVuY3Rpb24gZ2V0Q29uZmlnVmFsdWUoa2V5LCBnZW5vbWUsIGNvbmZpZykge1xuICByZXR1cm4gb2JqZWN0cy5nZXRWYWx1ZUZvcktleShrZXksIGNvbmZpZyk7XG59XG5cbmZ1bmN0aW9uIGdldFZhbHVlQWN0aXZlKGFjdGl2ZUtleXMsIGtleSkge1xuICByZXR1cm4gYWN0aXZlS2V5cy5oYXMoa2V5KTtcbn1cblxuZnVuY3Rpb24gZ2V0QWN0aXZlS2V5cyhhY3RpdmVLZXlzLCBwcmVmaXgpIHtcbiAgY29uc3QgcmVzdWx0ID0gW107XG4gIGFjdGl2ZUtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIXByZWZpeCB8fCBrZXkuc3RhcnRzV2l0aChwcmVmaXgpKSB7XG4gICAgICByZXN1bHQucHVzaChrZXkpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLy8gRXhwb3NlZCBmb3IgdGVzdGluZ1xuZXhwb3J0IGZ1bmN0aW9uIGV2YWx1YXRlUHJlZGljYXRlcyh2ZXJzaW9uLCBjb250ZXh0LCBjb25maWcpIHtcbiAgaWYgKCFjb25maWcuX2V4cGVyaW1lbnRzIHx8ICFjb25maWcuX2V4cGVyaW1lbnRzLmxlbmd0aCkge1xuICAgIHJldHVybiB7fTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGV2YWx1YXRlQnJhbmNoKGNvbnRleHQsIGNvbmZpZywgcHJlZml4LCBkaXNhYmxlZCwgZW50cnkpIHtcbiAgICBpZiAoY29uZmlnLl9wcmVkaWNhdGUpIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGV2YWx1YXRlKGNvbnRleHQsIGNvbmZpZy5fcHJlZGljYXRlKTtcbiAgICAgIGlmIChyZXN1bHQucmVqZWN0ZWQpIHtcbiAgICAgICAgZGlzYWJsZWQucHVzaChwcmVmaXgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvbmZpZy5faXNfZW50cnlfcG9pbnQpIHtcbiAgICAgIGVudHJ5LnB1c2gocHJlZml4KTtcbiAgICB9XG5cbiAgICBPYmplY3Qua2V5cyhjb25maWcpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgaWYgKGtleS5zdGFydHNXaXRoKCdfJykpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBldmFsdWF0ZUJyYW5jaChjb250ZXh0LCBjb25maWdba2V5XSwgcHJlZml4ID8gcHJlZml4ICsgJy4nICsga2V5IDoga2V5LCBkaXNhYmxlZCwgZW50cnkpO1xuICAgIH0pO1xuICB9XG5cbiAgY29uc3QgZXZhbHVhYmxlQ29udGV4dCA9IGNvbnRleHQucmVzb2x2ZSgpO1xuXG4gIGNvbnN0IHJlc3VsdCA9IHt9O1xuICBjb25maWcuX2V4cGVyaW1lbnRzLmZvckVhY2goZnVuY3Rpb24oZXhwKSB7XG4gICAgY29uc3QgZXZhbHVhYmxlQ29uZmlnID0gb2JqZWN0cy5hc3NpZ24oe30sIGV4cCk7XG4gICAgZGVsZXRlIGV2YWx1YWJsZUNvbmZpZy5pZDtcbiAgICBjb25zdCByZXN1bHRzID0ge1xuICAgICAgZGlzYWJsZWQ6IFtdLFxuICAgICAgZW50cnk6IFtdXG4gICAgfTtcblxuICAgIGV2YWx1YXRlQnJhbmNoKGV2YWx1YWJsZUNvbnRleHQsIGV2YWx1YWJsZUNvbmZpZywgJycsIHJlc3VsdHMuZGlzYWJsZWQsIHJlc3VsdHMuZW50cnkpO1xuICAgIHJlc3VsdFtleHAuaWRdID0gcmVzdWx0cztcbiAgfSk7XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gRXZvbHZTdG9yZShvcHRpb25zKSB7XG4gIGNvbnN0IHByZWZpeCA9IG9wdGlvbnMuZW5kcG9pbnQgKyAnLycgKyBvcHRpb25zLmVudjtcbiAgY29uc3Qga2V5SWQgPSBvcHRpb25zLmF1dGggJiYgb3B0aW9ucy5hdXRoLmlkO1xuICBjb25zdCBrZXkgPSBvcHRpb25zLmF1dGggJiYgb3B0aW9ucy5hdXRoLnNlY3JldDtcbiAgY29uc3QgdmVyc2lvbiA9IG9wdGlvbnMudmVyc2lvbiB8fCAxO1xuXG4gIGxldCBjb250ZXh0O1xuICBsZXQgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgbGV0IHdhaXRpbmdUb1B1bGwgPSBmYWxzZTtcbiAgbGV0IHdhaXRpbmdUb1B1bGxJbW1lZGlhdGUgPSB0cnVlO1xuICBsZXQgY29udGFtaW5hdGVkID0gZmFsc2U7XG4gIGxldCBnZW5vbWVzID0ge307XG4gIGxldCBlZmZlY3RpdmVHZW5vbWUgPSB7fTtcbiAgbGV0IGFsbG9jYXRpb25zID0gbnVsbDtcbiAgbGV0IGNvbmZpZyA9IG51bGw7XG4gIGxldCBnZW5vbWVGYWlsZWQgPSBmYWxzZTtcbiAgbGV0IGNvbmZpZ0ZhaWxlZCA9IGZhbHNlO1xuICBjb25zdCBnZW5vbWVLZXlTdGF0ZXMgPSB7XG4gICAgbmVlZGVkOiBuZXcgU2V0KCksXG4gICAgcmVxdWVzdGVkOiBuZXcgU2V0KCksXG4gICAgbG9hZGVkOiBuZXcgU2V0KClcbiAgfTtcblxuICBjb25zdCBjb25maWdLZXlTdGF0ZXMgPSB7XG4gICAgZW50cnk6IG5ldyBTZXQoKSxcbiAgICBhY3RpdmU6IG5ldyBTZXQoKSxcbiAgICBuZWVkZWQ6IG5ldyBTZXQoKSxcbiAgICByZXF1ZXN0ZWQ6IG5ldyBTZXQoKSxcbiAgICBsb2FkZWQ6IG5ldyBTZXQoKVxuICB9O1xuXG4gIGxldCBvdXRzdGFuZGluZ1ZhbHVlUHJvbWlzZXMgPSBbXTtcbiAgbGV0IG91dHN0YW5kaW5nQ29uZmlnUHJvbWlzZXMgPSBbXTtcbiAgbGV0IHN1YnNjcmlwdGlvbnMgPSBuZXcgU2V0KCk7XG5cbiAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG4gICAgZ2Vub21lcyA9IHVuZGVmaW5lZDtcbiAgICBlZmZlY3RpdmVHZW5vbWUgPSB1bmRlZmluZWQ7XG4gICAgYWxsb2NhdGlvbnMgPSB1bmRlZmluZWQ7XG4gICAgY29uZmlnID0gdW5kZWZpbmVkO1xuXG4gICAgZGVsZXRlIGdlbm9tZUtleVN0YXRlcy5uZWVkZWQ7XG4gICAgZGVsZXRlIGdlbm9tZUtleVN0YXRlcy5yZXF1ZXN0ZWQ7XG4gICAgZGVsZXRlIGdlbm9tZUtleVN0YXRlcy5sb2FkZWQ7XG5cbiAgICBkZWxldGUgY29uZmlnS2V5U3RhdGVzLmVudHJ5O1xuICAgIGRlbGV0ZSBjb25maWdLZXlTdGF0ZXMuYWN0aXZlO1xuICAgIGRlbGV0ZSBjb25maWdLZXlTdGF0ZXMubmVlZGVkO1xuICAgIGRlbGV0ZSBjb25maWdLZXlTdGF0ZXMucmVxdWVzdGVkO1xuICAgIGRlbGV0ZSBjb25maWdLZXlTdGF0ZXMubG9hZGVkO1xuICAgIG91dHN0YW5kaW5nVmFsdWVQcm9taXNlcy5mb3JFYWNoKGZ1bmN0aW9uKHApIHtcbiAgICAgIHAucmVqZWN0KCk7XG4gICAgfSk7XG4gICAgb3V0c3RhbmRpbmdWYWx1ZVByb21pc2VzID0gdW5kZWZpbmVkO1xuICAgIG91dHN0YW5kaW5nQ29uZmlnUHJvbWlzZXMuZm9yRWFjaChmdW5jdGlvbihwKSB7XG4gICAgICBwLnJlamVjdCgpO1xuICAgIH0pO1xuICAgIG91dHN0YW5kaW5nQ29uZmlnUHJvbWlzZXMgPSB1bmRlZmluZWQ7XG4gICAgc3Vic2NyaXB0aW9ucyA9IHVuZGVmaW5lZDtcbiAgICBlbWl0KGNvbnRleHQsIFNUT1JFX0RFU1RST1lFRCwgdGhpcyk7XG4gICAgY29udGV4dCA9IHVuZGVmaW5lZDtcbiAgfTtcblxuICBmdW5jdGlvbiByZWV2YWx1YXRlQ29udGV4dCgpIHtcbiAgICBpZiAoIWNvbmZpZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdHMgPSBldmFsdWF0ZVByZWRpY2F0ZXModmVyc2lvbiwgY29udGV4dCwgY29uZmlnKTtcbiAgICBjb25maWdLZXlTdGF0ZXMuYWN0aXZlLmNsZWFyKCk7XG4gICAgY29uZmlnS2V5U3RhdGVzLmVudHJ5LmNsZWFyKCk7XG4gICAgZWZmZWN0aXZlR2Vub21lID0ge307XG4gICAgT2JqZWN0LmtleXMocmVzdWx0cykuZm9yRWFjaChmdW5jdGlvbihlaWQpIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHJlc3VsdHNbZWlkXTtcbiAgICAgIGdlbm9tZUtleVN0YXRlcy5sb2FkZWQuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgY29uc3QgYWN0aXZlID0gIXJlc3VsdC5kaXNhYmxlZC5zb21lKGZ1bmN0aW9uKGRpc2FibGVkS2V5KSB7XG4gICAgICAgICAgcmV0dXJuIGtleS5zdGFydHNXaXRoKGRpc2FibGVkS2V5KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGFjdGl2ZSkge1xuICAgICAgICAgIGNvbmZpZ0tleVN0YXRlcy5hY3RpdmUuYWRkKGtleSk7XG4gICAgICAgICAgY29uc3QgZW50cnkgPSByZXN1bHQuZW50cnkuc29tZShmdW5jdGlvbihlbnRyeUtleSkge1xuICAgICAgICAgICAgcmV0dXJuIGtleS5zdGFydHNXaXRoKGVudHJ5S2V5KTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGlmIChlbnRyeSkge1xuICAgICAgICAgICAgY29uZmlnS2V5U3RhdGVzLmVudHJ5LmFkZChrZXkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGlmIChlaWQgaW4gZ2Vub21lcykge1xuICAgICAgICBlZmZlY3RpdmVHZW5vbWUgPSBvYmplY3RzLmRlZXBNZXJnZShlZmZlY3RpdmVHZW5vbWUsIG9iamVjdHMuZmlsdGVyKGdlbm9tZXNbZWlkXSwgY29uZmlnS2V5U3RhdGVzLmFjdGl2ZSkpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgZW1pdChjb250ZXh0LCBFRkZFQ1RJVkVfR0VOT01FX1VQREFURUQsIGVmZmVjdGl2ZUdlbm9tZSk7XG4gICAgc3Vic2NyaXB0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKGxpc3RlbmVyKSB7XG4gICAgICB0cnkge1xuICAgICAgICBsaXN0ZW5lcihlZmZlY3RpdmVHZW5vbWUsIGNvbmZpZyk7XG4gICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICBjb25zb2xlLmVycm9yKGV4KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZUdlbm9tZSh2YWx1ZSkge1xuICAgIGNvbnN0IGFsbG9jcyA9IFtdO1xuICAgIGNvbnN0IGV4Y2x1c2lvbnMgPSBbXTtcbiAgICBhbGxvY2F0aW9ucyA9IHZhbHVlO1xuICAgIGdlbm9tZUZhaWxlZCA9IGZhbHNlO1xuICAgIHZhbHVlLmZvckVhY2goZnVuY3Rpb24oYWxsb2MpIHtcbiAgICAgIGNvbnN0IGNsZWFuID0gb2JqZWN0cy5hc3NpZ24oe30sIGFsbG9jKTtcbiAgICAgIGRlbGV0ZSBjbGVhbi5nZW5vbWU7XG4gICAgICBkZWxldGUgY2xlYW4uYXVkaWVuY2VfcXVlcnk7XG5cbiAgICAgIGFsbG9jcy5wdXNoKGNsZWFuKTtcbiAgICAgIGlmIChjbGVhbi5leGNsdWRlZCkge1xuICAgICAgICBleGNsdXNpb25zLnB1c2goY2xlYW4uZWlkKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBnZW5vbWVzW2NsZWFuLmVpZF0gPSBhbGxvYy5nZW5vbWU7XG4gICAgICBvYmplY3RzLmZsYXR0ZW5LZXlzKGFsbG9jLmdlbm9tZSwgZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIHJldHVybiAha2V5LnN0YXJ0c1dpdGgoJ18nKTtcbiAgICAgIH0pLmZvckVhY2goZ2Vub21lS2V5U3RhdGVzLmxvYWRlZC5hZGQuYmluZChnZW5vbWVLZXlTdGF0ZXMubG9hZGVkKSk7XG4gICAgfSk7XG4gICAgY29udGV4dC5zZXQoJ2V4cGVyaW1lbnRzLmFsbG9jYXRpb25zJywgYWxsb2NzKTtcbiAgICBjb250ZXh0LnNldCgnZXhwZXJpbWVudHMuZXhjbHVzaW9ucycsIGV4Y2x1c2lvbnMpO1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlQ29uZmlnKHZhbHVlKSB7XG4gICAgY29uZmlnID0gdmFsdWU7XG4gICAgY29uZmlnRmFpbGVkID0gZmFsc2U7XG4gICAgdmFsdWUuX2V4cGVyaW1lbnRzLmZvckVhY2goZnVuY3Rpb24oZXhwKSB7XG4gICAgICBjb25zdCBjbGVhbiA9IG9iamVjdHMuYXNzaWduKHt9LCBleHApO1xuICAgICAgZGVsZXRlIGNsZWFuLmlkO1xuICAgICAgb2JqZWN0cy5mbGF0dGVuS2V5cyhjbGVhbiwgZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIHJldHVybiAha2V5LnN0YXJ0c1dpdGgoJ18nKTtcbiAgICAgIH0pLmZvckVhY2goY29uZmlnS2V5U3RhdGVzLmxvYWRlZC5hZGQuYmluZChjb25maWdLZXlTdGF0ZXMubG9hZGVkKSk7XG4gICAgfSk7XG4gIH1cblxuXG4gIGZ1bmN0aW9uIHVwZGF0ZShjb25maWdSZXF1ZXN0LCByZXF1ZXN0ZWRLZXlzLCB2YWx1ZSkge1xuICAgIGxldCBrZXlTdGF0ZXMgPSBjb25maWdSZXF1ZXN0ID8gY29uZmlnS2V5U3RhdGVzIDogZ2Vub21lS2V5U3RhdGVzO1xuXG4gICAgcmVxdWVzdGVkS2V5cy5mb3JFYWNoKGtleVN0YXRlcy5yZXF1ZXN0ZWQuZGVsZXRlLmJpbmQoa2V5U3RhdGVzLnJlcXVlc3RlZCkpO1xuICAgIGlmIChjb25maWdSZXF1ZXN0KSB7XG4gICAgICBlbWl0KGNvbnRleHQsIENPTkZJR19SRVFVRVNUX1JFQ0VJVkVELCByZXF1ZXN0ZWRLZXlzKTtcbiAgICAgIHVwZGF0ZUNvbmZpZyh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVtaXQoY29udGV4dCwgR0VOT01FX1JFUVVFU1RfUkVDRUlWRUQsIHJlcXVlc3RlZEtleXMpO1xuICAgICAgdXBkYXRlR2Vub21lKHZhbHVlKTtcbiAgICB9XG5cbiAgICByZWV2YWx1YXRlQ29udGV4dCgpO1xuXG4gICAgbGV0IHJlbW92ZUNvbmZpZyA9IFtdO1xuICAgIGxldCByZW1vdmVWYWx1ZSA9IFtdO1xuICAgIG91dHN0YW5kaW5nVmFsdWVQcm9taXNlcy5jb25jYXQob3V0c3RhbmRpbmdDb25maWdQcm9taXNlcykuZm9yRWFjaChmdW5jdGlvbihwcm9taXNlKSB7XG4gICAgICBpZiAocHJvbWlzZS5zb3VyY2UgPT09IEdFTk9NRV9TT1VSQ0UgJiYgKCFwcm9taXNlLmtleSB8fCAhZ2Vub21lS2V5U3RhdGVzLmxvYWRlZC5oYXMocHJvbWlzZS5rZXkpKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGxldCBjb25maWdMb2FkZWQgPSB0cnVlO1xuICAgICAgaWYgKHByb21pc2Uua2V5KSB7XG4gICAgICAgIGNvbmZpZ0xvYWRlZCA9IGZhbHNlO1xuICAgICAgICBjb25maWdLZXlTdGF0ZXMubG9hZGVkLmZvckVhY2goZnVuY3Rpb24ocHJlZml4KSB7XG4gICAgICAgICAgaWYgKHByb21pc2Uua2V5LnN0YXJ0c1dpdGgocHJlZml4KSkge1xuICAgICAgICAgICAgY29uZmlnTG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWNvbmZpZ0xvYWRlZCAmJiAhKGNvbmZpZ1JlcXVlc3QgJiYgKHZlcnNpb24gPT09IDEgfHwgcmVxdWVzdGVkS2V5cy5pbmRleE9mKHByb21pc2Uua2V5KSA+PSAwKSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBwcm9taXNlLnJlc29sdmUocHJvbWlzZS50cmFuc2Zvcm0ocHJvbWlzZS5rZXksIGVmZmVjdGl2ZUdlbm9tZSwgY29uZmlnKSk7XG4gICAgICAocHJvbWlzZS5zb3VyY2UgPT09IENPTkZJR19TT1VSQ0UgPyByZW1vdmVDb25maWcgOiByZW1vdmVWYWx1ZSkucHVzaChwcm9taXNlKTtcbiAgICB9KTtcblxuICAgIG91dHN0YW5kaW5nVmFsdWVQcm9taXNlcyA9IG91dHN0YW5kaW5nVmFsdWVQcm9taXNlcy5maWx0ZXIoZnVuY3Rpb24ocHJvbWlzZSkge1xuICAgICAgcmV0dXJuIHJlbW92ZVZhbHVlLmluZGV4T2YocHJvbWlzZSkgPCAwO1xuICAgIH0pO1xuXG4gICAgb3V0c3RhbmRpbmdDb25maWdQcm9taXNlcyA9IG91dHN0YW5kaW5nQ29uZmlnUHJvbWlzZXMuZmlsdGVyKGZ1bmN0aW9uKHByb21pc2UpIHtcbiAgICAgIHJldHVybiByZW1vdmVDb25maWcuaW5kZXhPZihwcm9taXNlKSA8IDA7XG4gICAgfSk7XG5cbiAgICBlbWl0KGNvbnRleHQsY29uZmlnUmVxdWVzdCA/IENPTkZJR19VUERBVEVEIDogR0VOT01FX1VQREFURUQsIHZhbHVlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZhaWxlZChjb25maWdSZXF1ZXN0LCByZXF1ZXN0ZWRLZXlzLCBlcnIpIHtcbiAgICBjb250YW1pbmF0ZWQgPSB0cnVlO1xuICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgbGV0IGtleVN0YXRlcztcbiAgICBlbWl0KGNvbnRleHQsIFJFUVVFU1RfRkFJTEVELCBjb25maWdSZXF1ZXN0ID8gQ09ORklHX1NPVVJDRSA6IEdFTk9NRV9TT1VSQ0UsIHJlcXVlc3RlZEtleXMsIGVycik7XG4gICAgaWYgKGNvbmZpZ1JlcXVlc3QpIHtcbiAgICAgIGtleVN0YXRlcyA9IGNvbmZpZ0tleVN0YXRlcztcbiAgICB9IGVsc2Uge1xuICAgICAga2V5U3RhdGVzID0gZ2Vub21lS2V5U3RhdGVzO1xuICAgIH1cbiAgICBtb3ZlS2V5cyhyZXF1ZXN0ZWRLZXlzLCBrZXlTdGF0ZXMucmVxdWVzdGVkLCBrZXlTdGF0ZXMubmVlZGVkKTtcblxuICAgIGxldCBvdXRzdGFuZGluZ1Byb21pc2VzO1xuICAgIGlmIChjb25maWdSZXF1ZXN0KSB7XG4gICAgICBvdXRzdGFuZGluZ1Byb21pc2VzID0gb3V0c3RhbmRpbmdDb25maWdQcm9taXNlcztcbiAgICAgIGNvbmZpZ0ZhaWxlZCA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHN0YW5kaW5nUHJvbWlzZXMgPSBvdXRzdGFuZGluZ1ZhbHVlUHJvbWlzZXM7XG4gICAgICBnZW5vbWVGYWlsZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIGxldCByZW1vdmVDb25maWcgPSBbXTtcbiAgICBsZXQgcmVtb3ZlVmFsdWUgPSBbXTtcbiAgICBvdXRzdGFuZGluZ1ZhbHVlUHJvbWlzZXMuY29uY2F0KG91dHN0YW5kaW5nQ29uZmlnUHJvbWlzZXMpLmZvckVhY2goZnVuY3Rpb24ocHJvbWlzZSkge1xuICAgICAgaWYgKHZlcnNpb24gPT09IDEgfHwgcmVxdWVzdGVkS2V5cy5pbmRleE9mKHByb21pc2Uua2V5KSA+PSAwKSB7XG4gICAgICAgIChwcm9taXNlLnNvdXJjZSA9PT0gQ09ORklHX1NPVVJDRSA/IHJlbW92ZUNvbmZpZyA6IHJlbW92ZVZhbHVlKS5wdXNoKHByb21pc2UpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHByb21pc2UucmVqZWN0KGVycik7XG4gICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihleCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIG91dHN0YW5kaW5nVmFsdWVQcm9taXNlcyA9IG91dHN0YW5kaW5nVmFsdWVQcm9taXNlcy5maWx0ZXIoZnVuY3Rpb24ocHJvbWlzZSkge1xuICAgICAgcmV0dXJuIHJlbW92ZVZhbHVlLmluZGV4T2YocHJvbWlzZSkgPj0gMDtcbiAgICB9KTtcblxuICAgIG91dHN0YW5kaW5nQ29uZmlnUHJvbWlzZXMgPSBvdXRzdGFuZGluZ0NvbmZpZ1Byb21pc2VzLmZpbHRlcihmdW5jdGlvbihwcm9taXNlKSB7XG4gICAgICByZXR1cm4gcmVtb3ZlQ29uZmlnLmluZGV4T2YocHJvbWlzZSkgPj0gMDtcbiAgICB9KTtcblxuICAgIGlmIChjb25maWdSZXF1ZXN0KSB7XG4gICAgICBvdXRzdGFuZGluZ0NvbmZpZ1Byb21pc2VzID0gb3V0c3RhbmRpbmdQcm9taXNlcztcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0c3RhbmRpbmdWYWx1ZVByb21pc2VzID0gb3V0c3RhbmRpbmdQcm9taXNlcztcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBwdWxsKGltbWVkaWF0ZSkge1xuICAgIGlmICghaW5pdGlhbGl6ZWQpIHtcbiAgICAgIHdhaXRpbmdUb1B1bGxJbW1lZGlhdGUgPSB3YWl0aW5nVG9QdWxsSW1tZWRpYXRlIHx8IGltbWVkaWF0ZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIWltbWVkaWF0ZSAmJiAhd2FpdGluZ1RvUHVsbEltbWVkaWF0ZSkge1xuICAgICAgaWYgKCF3YWl0aW5nVG9QdWxsKSB7XG4gICAgICAgIHdhaXRpbmdUb1B1bGwgPSB0cnVlO1xuICAgICAgICBzZXRUaW1lb3V0KHB1bGwuYmluZCh1bmRlZmluZWQsIHRydWUpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHdhaXRpbmdUb1B1bGxJbW1lZGlhdGUgPSBmYWxzZTtcblxuICAgIGlmIChjb25maWdLZXlTdGF0ZXMubmVlZGVkLnNpemUgfHwgdmVyc2lvbiA9PT0gMSkge1xuICAgICAgY29uc3QgcmVxdWVzdGVkS2V5cyA9IFtdO1xuICAgICAgY29uZmlnS2V5U3RhdGVzLm5lZWRlZC5mb3JFYWNoKHJlcXVlc3RlZEtleXMucHVzaC5iaW5kKHJlcXVlc3RlZEtleXMpKTtcbiAgICAgIGNvbmZpZ0tleVN0YXRlcy5uZWVkZWQuY2xlYXIoKTtcbiAgICAgIHJldHJpZXZlKHtcbiAgICAgICAgbWV0aG9kOiAnZ2V0JyxcbiAgICAgICAgdXJsOiBwcmVmaXggKyAnL2NvbmZpZ3VyYXRpb24uanNvbicsXG4gICAgICAgIGtleUlkOiBrZXlJZCxcbiAgICAgICAga2V5OiBrZXlcbiAgICAgIH0pXG4gICAgICAgIC50aGVuKHVwZGF0ZS5iaW5kKHRoaXMsIHRydWUsIHJlcXVlc3RlZEtleXMpKVxuICAgICAgICAuY2F0Y2goZmFpbGVkLmJpbmQodGhpcywgdHJ1ZSwgcmVxdWVzdGVkS2V5cykpO1xuICAgICAgbW92ZUtleXMocmVxdWVzdGVkS2V5cywgY29uZmlnS2V5U3RhdGVzLm5lZWRlZCwgY29uZmlnS2V5U3RhdGVzLnJlcXVlc3RlZCk7XG4gICAgICBlbWl0KGNvbnRleHQsIENPTkZJR19SRVFVRVNUX1NFTlQsIHJlcXVlc3RlZEtleXMpO1xuICAgIH1cblxuICAgIGlmIChnZW5vbWVLZXlTdGF0ZXMubmVlZGVkLnNpemUgfHwgdmVyc2lvbiA9PT0gMSkge1xuICAgICAgY29uc3QgcmVxdWVzdGVkS2V5cyA9IFtdO1xuICAgICAgZ2Vub21lS2V5U3RhdGVzLm5lZWRlZC5mb3JFYWNoKHJlcXVlc3RlZEtleXMucHVzaC5iaW5kKHJlcXVlc3RlZEtleXMpKTtcbiAgICAgIGdlbm9tZUtleVN0YXRlcy5uZWVkZWQuY2xlYXIoKTtcbiAgICAgIHJldHJpZXZlKHtcbiAgICAgICAgbWV0aG9kOiAncG9zdCcsXG4gICAgICAgIHVybDogcHJlZml4ICsgJy9hbGxvY2F0aW9ucycsXG4gICAgICAgIGtleUlkOiBrZXlJZCxcbiAgICAgICAga2V5OiBrZXksXG4gICAgICAgIGRhdGE6IHt1aWQ6IGNvbnRleHQudWlkLCBzaWQ6IGNvbnRleHQudWlkfVxuICAgICAgfSlcbiAgICAgICAgLnRoZW4odXBkYXRlLmJpbmQodGhpcywgZmFsc2UsIHJlcXVlc3RlZEtleXMpKVxuICAgICAgICAuY2F0Y2goZmFpbGVkLmJpbmQodGhpcywgZmFsc2UsIHJlcXVlc3RlZEtleXMpKTtcbiAgICAgIG1vdmVLZXlzKHJlcXVlc3RlZEtleXMsIGdlbm9tZUtleVN0YXRlcy5uZWVkZWQsIGdlbm9tZUtleVN0YXRlcy5yZXF1ZXN0ZWQpO1xuICAgICAgZW1pdChjb250ZXh0LCBHRU5PTUVfUkVRVUVTVF9TRU5ULCByZXF1ZXN0ZWRLZXlzKTtcbiAgICB9XG5cbiAgICB3YWl0aW5nVG9QdWxsID0gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVSZXF1ZXN0U3Vic2NyaWJhYmxlUHJvbWlzZShzb3VyY2UsIHRyYW5zZm9ybSwga2V5KSB7XG4gICAgbGV0IHJlc29sdmUgPSBudWxsO1xuICAgIGxldCByZWplY3QgPSBudWxsO1xuICAgIGNvbnN0IHByb21pc2UgPSBNaW5pUHJvbWlzZS5jcmVhdGVQcm9taXNlKGZ1bmN0aW9uKHJlcywgcmVqKSB7XG4gICAgICByZXNvbHZlID0gd3JhcExpc3RlbmVyKHJlcyk7XG4gICAgICByZWplY3QgPSB3cmFwTGlzdGVuZXIocmVqKTtcbiAgICB9KTtcblxuICAgIHByb21pc2UubGlzdGVuID0gZnVuY3Rpb24obGlzdGVuZXIpIHtcbiAgICAgIHN1YnNjcmlwdGlvbnMuYWRkKGZ1bmN0aW9uKGVmZmVjdGl2ZUdlbm9tZSwgY29uZmlnKSB7XG4gICAgICAgIGxpc3RlbmVyKHRyYW5zZm9ybShrZXksIGVmZmVjdGl2ZUdlbm9tZSwgY29uZmlnKSk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgbGV0IGtleVN0YXRlcztcbiAgICBsZXQgZmFpbGVkO1xuICAgIGxldCBvdXRzdGFuZGluZ1Byb21pc2VzO1xuICAgIGxldCBsb2FkZWQgPSBmYWxzZTtcbiAgICBpZiAoc291cmNlID09PSBHRU5PTUVfU09VUkNFKSB7XG4gICAgICBrZXlTdGF0ZXMgPSBnZW5vbWVLZXlTdGF0ZXM7XG4gICAgICBmYWlsZWQgPSBnZW5vbWVGYWlsZWQ7XG4gICAgICBvdXRzdGFuZGluZ1Byb21pc2VzID0gb3V0c3RhbmRpbmdWYWx1ZVByb21pc2VzO1xuICAgICAgbG9hZGVkID0ga2V5U3RhdGVzLmxvYWRlZC5oYXMoa2V5KTtcbiAgICB9IGVsc2Uge1xuICAgICAga2V5U3RhdGVzID0gY29uZmlnS2V5U3RhdGVzO1xuICAgICAgZmFpbGVkID0gY29uZmlnRmFpbGVkO1xuICAgICAgb3V0c3RhbmRpbmdQcm9taXNlcyA9IG91dHN0YW5kaW5nQ29uZmlnUHJvbWlzZXM7XG4gICAgICBrZXlTdGF0ZXMubG9hZGVkLmZvckVhY2goZnVuY3Rpb24ocHJlZml4KSB7XG4gICAgICAgIGlmICgha2V5IHx8IGtleS5zdGFydHNXaXRoKHByZWZpeCkpIHtcbiAgICAgICAgICBsb2FkZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAobG9hZGVkKSB7XG4gICAgICByZXNvbHZlKHRyYW5zZm9ybShrZXksIGVmZmVjdGl2ZUdlbm9tZSwgY29uZmlnKSk7XG4gICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG5cbiAgICBpZiAoa2V5U3RhdGVzLmxvYWRlZC5oYXMoa2V5KSkge1xuICAgICAgcmVzb2x2ZSh0cmFuc2Zvcm0oa2V5LCBlZmZlY3RpdmVHZW5vbWUsIGNvbmZpZykpO1xuICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuXG4gICAgaWYgKGZhaWxlZCkge1xuICAgICAgcmVqZWN0KCdUaGUgdmFsdWVzIGNvdWxkIG5vdCBiZSByZXRyaWV2ZWQnKTtcbiAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH1cblxuICAgIGNvbnN0IG91dHN0YW5kaW5nID0ge1xuICAgICAga2V5OiBrZXksXG4gICAgICByZXNvbHZlOiByZXNvbHZlLFxuICAgICAgcmVqZWN0OiByZWplY3QsXG4gICAgICB0cmFuc2Zvcm06IHRyYW5zZm9ybSxcbiAgICAgIHNvdXJjZTogc291cmNlXG4gICAgfTtcbiAgICBvdXRzdGFuZGluZ1Byb21pc2VzLnB1c2gob3V0c3RhbmRpbmcpO1xuXG4gICAgaWYgKHZlcnNpb24gIT09IDEgJiYgIWtleVN0YXRlcy5uZWVkZWQuaGFzKGtleSkgJiYgIWtleVN0YXRlcy5yZXF1ZXN0ZWQuaGFzKGtleSkpIHtcbiAgICAgIGtleVN0YXRlcy5uZWVkZWQuYWRkKGtleSk7XG5cbiAgICAgIGlmIChzb3VyY2UgPT09IEdFTk9NRV9TT1VSQ0UpIHtcbiAgICAgICAgY29uZmlnS2V5U3RhdGVzLm5lZWRlZC5hZGQoa2V5KTtcbiAgICAgIH1cblxuICAgICAgcHVsbCgpO1xuICAgIH1cblxuICAgIHJldHVybiBwcm9taXNlO1xuICB9XG5cbiAgaWYgKHZlcnNpb24gPT09IDEpIHtcbiAgICBwdWxsKHRydWUpO1xuICB9IGVsc2UgaWYgKG9wdGlvbnMudmVyc2lvbiAhPT0gMikge1xuICAgIHRocm93IG5ldyBFcnJvcignVW5zdXBwb3J0ZWQgQVBJIHZlcnNpb24nKTtcbiAgfVxuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnc3RhdGUnLCB7XG4gICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGFsbG9jYXRpb25zOiBvYmplY3RzLmRlZXBDbG9uZShhbGxvY2F0aW9ucyksXG4gICAgICAgIGNvbmZpZzogb2JqZWN0cy5kZWVwQ2xvbmUoY29uZmlnKVxuICAgICAgfTtcbiAgICB9XG4gIH0pO1xuXG4gIHRoaXMuZmV0Y2ggPSBwdWxsLmJpbmQodGhpcywgdHJ1ZSk7XG5cbiAgdGhpcy5wcmVsb2FkID0gZnVuY3Rpb24ocHJlZml4ZXMsIGNvbmZpZ09ubHksIGltbWVkaWF0ZSkge1xuICAgIHByZWZpeGVzLmZvckVhY2goY29uZmlnS2V5U3RhdGVzLm5lZWRlZC5hZGQuYmluZChjb25maWdLZXlTdGF0ZXMubmVlZGVkKSk7XG5cbiAgICBpZiAoIWNvbmZpZ09ubHkpIHtcbiAgICAgIHByZWZpeGVzLmZvckVhY2goZ2Vub21lS2V5U3RhdGVzLm5lZWRlZC5hZGQuYmluZChnZW5vbWVLZXlTdGF0ZXMubmVlZGVkKSk7XG4gICAgfVxuICAgIHB1bGwoaW1tZWRpYXRlKTtcbiAgfTtcblxuICB0aGlzLmluaXRpYWxpemUgPSBmdW5jdGlvbihfY29udGV4dCkge1xuICAgIGlmIChpbml0aWFsaXplZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFdm9sdjogVGhlIHN0b3JlIGhhcyBhbHJlYWR5IGJlZW4gaW5pdGlhbGl6ZWQuJyk7XG4gICAgfVxuICAgIGNvbnRleHQgPSBfY29udGV4dDtcbiAgICBpbml0aWFsaXplZCA9IHRydWU7XG4gICAgcHVsbCgpO1xuICAgIHdhaXRGb3IoY29udGV4dCwgQ09OVEVYVF9DSEFOR0VELCByZWV2YWx1YXRlQ29udGV4dCk7XG4gIH07XG5cbiAgdGhpcy5zdWJzY3JpYmUgPSBzdWJzY3JpcHRpb25zLmFkZC5iaW5kKHN1YnNjcmlwdGlvbnMpO1xuICB0aGlzLnVuc3Vic2NyaWJlID0gc3Vic2NyaXB0aW9ucy5kZWxldGUuYmluZChzdWJzY3JpcHRpb25zKTtcblxuICB0aGlzLmdldCA9IGNyZWF0ZVJlcXVlc3RTdWJzY3JpYmFibGVQcm9taXNlLmJpbmQodGhpcywgR0VOT01FX1NPVVJDRSwgZ2V0VmFsdWUuYmluZCh0aGlzKSk7XG4gIHRoaXMuZ2V0Q29uZmlnID0gY3JlYXRlUmVxdWVzdFN1YnNjcmliYWJsZVByb21pc2UuYmluZCh0aGlzLCBDT05GSUdfU09VUkNFLCBnZXRDb25maWdWYWx1ZS5iaW5kKHRoaXMpKTtcbiAgdGhpcy5pc0FjdGl2ZSA9IGNyZWF0ZVJlcXVlc3RTdWJzY3JpYmFibGVQcm9taXNlLmJpbmQoXG4gICAgdGhpcywgQ09ORklHX1NPVVJDRSwgZ2V0VmFsdWVBY3RpdmUuYmluZCh0aGlzLCBjb25maWdLZXlTdGF0ZXMuYWN0aXZlKSk7XG4gIHRoaXMuZ2V0QWN0aXZlS2V5cyA9IGNyZWF0ZVJlcXVlc3RTdWJzY3JpYmFibGVQcm9taXNlLmJpbmQoXG4gICAgdGhpcywgQ09ORklHX1NPVVJDRSwgZ2V0QWN0aXZlS2V5cy5iaW5kKHRoaXMsIGNvbmZpZ0tleVN0YXRlcy5hY3RpdmUpKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgRXZvbHZTdG9yZTtcbiIsImNvbnN0IHNjb3BlZEhhbmRsZXJzID0gbmV3IE1hcCgpO1xuY29uc3Qgc2NvcGVkT25jZUhhbmRsZXJzID0gbmV3IE1hcCgpO1xuY29uc3Qgc2NvcGVkUGF5bG9hZHMgPSBuZXcgTWFwKCk7XG5cbmZ1bmN0aW9uIGVuc3VyZVNjb3BlKHNjb3BlKSB7XG4gIGlmIChzY29wZWRIYW5kbGVycy5oYXMoc2NvcGUpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgc2NvcGVkSGFuZGxlcnMuc2V0KHNjb3BlLCB7fSk7XG4gIHNjb3BlZE9uY2VIYW5kbGVycy5zZXQoc2NvcGUsIHt9KTtcbiAgc2NvcGVkUGF5bG9hZHMuc2V0KHNjb3BlLCB7fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95U2NvcGUoc2NvcGUpIHtcbiAgc2NvcGVkSGFuZGxlcnMuZGVsZXRlKHNjb3BlKTtcbiAgc2NvcGVkT25jZUhhbmRsZXJzLmRlbGV0ZShzY29wZSk7XG4gIHNjb3BlZFBheWxvYWRzLmRlbGV0ZShzY29wZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3YWl0Rm9yKHNjb3BlLCBpdCwgaGFuZGxlcikge1xuICBlbnN1cmVTY29wZShzY29wZSk7XG5cbiAgY29uc3QgaGFuZGxlcnMgPSBzY29wZWRIYW5kbGVycy5nZXQoc2NvcGUpO1xuICBjb25zdCBwYXlsb2FkcyA9IHNjb3BlZFBheWxvYWRzLmdldChzY29wZSk7XG5cbiAgaWYgKCFoYW5kbGVyc1tpdF0pIHtcbiAgICBoYW5kbGVyc1tpdF0gPSBbaGFuZGxlcl07XG4gIH0gZWxzZSB7XG4gICAgaGFuZGxlcnNbaXRdLnB1c2goaGFuZGxlcik7XG4gIH1cblxuICBpZiAocGF5bG9hZHNbaXRdKSB7XG4gICAgaGFuZGxlci5hcHBseSh1bmRlZmluZWQsIHBheWxvYWRzW2l0XSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdhaXRPbmNlRm9yKHNjb3BlLCBpdCwgaGFuZGxlcikge1xuICBlbnN1cmVTY29wZShzY29wZSk7XG5cbiAgY29uc3Qgb25jZUhhbmRsZXJzID0gc2NvcGVkT25jZUhhbmRsZXJzLmdldChzY29wZSk7XG4gIGNvbnN0IHBheWxvYWRzID0gc2NvcGVkUGF5bG9hZHMuZ2V0KHNjb3BlKTtcblxuICBpZiAocGF5bG9hZHNbaXRdKSB7XG4gICAgaGFuZGxlci5hcHBseSh1bmRlZmluZWQsIHBheWxvYWRzW2l0XSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKCFvbmNlSGFuZGxlcnNbaXRdKSB7XG4gICAgb25jZUhhbmRsZXJzW2l0XSA9IFtoYW5kbGVyXTtcbiAgfSBlbHNlIHtcbiAgICBvbmNlSGFuZGxlcnMucHVzaChoYW5kbGVyKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZW1pdChzY29wZSwgaXQpIHtcbiAgZW5zdXJlU2NvcGUoc2NvcGUpO1xuXG4gIGNvbnN0IGhhbmRsZXJzID0gc2NvcGVkSGFuZGxlcnMuZ2V0KHNjb3BlKTtcbiAgY29uc3Qgb25jZUhhbmRsZXJzID0gc2NvcGVkT25jZUhhbmRsZXJzLmdldChzY29wZSk7XG4gIGNvbnN0IHBheWxvYWRzID0gc2NvcGVkUGF5bG9hZHMuZ2V0KHNjb3BlKTtcblxuICBjb25zdCBwYXlsb2FkID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICBwYXlsb2FkLnNoaWZ0KCk7XG4gIHBheWxvYWRzW2l0XSA9IHBheWxvYWQ7XG5cbiAgY29uc3Qgb2ggPSBvbmNlSGFuZGxlcnNbaXRdO1xuICB3aGlsZSAob2ggJiYgb2gubGVuZ3RoKSB7XG4gICAgbGV0IGhhbmRsZXIgPSBvaC5zaGlmdCgpO1xuICAgIHRyeSB7XG4gICAgICBoYW5kbGVyLmFwcGx5KHVuZGVmaW5lZCwgcGF5bG9hZCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICBjb25zb2xlLmxvZygnRmFpbGVkIHRvIGludm9rZSBvbmUgdGltZSBoYW5kbGVyIG9mICVzJywgaXQpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGhhbmRsZXJzRm9ySXQgPSBoYW5kbGVyc1tpdF07XG4gIGlmICghaGFuZGxlcnNGb3JJdCkge1xuICAgIHJldHVybjtcbiAgfVxuICBoYW5kbGVyc0Zvckl0LmZvckVhY2goZnVuY3Rpb24oaCkge1xuICAgIHRyeSB7XG4gICAgICBoLmFwcGx5KHVuZGVmaW5lZCwgcGF5bG9hZCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICBjb25zb2xlLmxvZygnRmFpbGVkIHRvIGludm9rZSBoYW5kbGVyIG9mICVzJywgaXQpO1xuICAgIH1cbiAgfSk7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGJhc2U2NC1hcnJheWJ1ZmZlcjsiLCJtb2R1bGUuZXhwb3J0cyA9IGRlZXBtZXJnZTsiLCJtb2R1bGUuZXhwb3J0cyA9IGh0dHA7IiwibW9kdWxlLmV4cG9ydHMgPSBodHRwczsiXSwic291cmNlUm9vdCI6IiJ9