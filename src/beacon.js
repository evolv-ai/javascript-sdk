import retrieve from './retrieve.js';
import { assign, omitUndefined } from './ponyfills/objects.js';

export const MAX_MESSAGE_SIZE = 2000;
export const DELAY = 100;
const ENDPOINT_PATTERN = /\/(v\d+)\/\w+\/([a-z]+)$/i;
const BATCH_SIZE = 25;

function fallbackBeacon(url, data, sync) {
  retrieve({
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

/**
 * @typedef EmitterOptions
 * @property {boolean} [blockTransmit=false]
 * @property {string} [clientName="javascript-sdk"]
 */

/**
 * @param endpoint
 * @param context
 * @param {Partial<EmitterOptions>} [options={}]
 * @constructor
 */
export default function Emitter(endpoint, context, options) {
  const endpointMatch = endpoint.match(ENDPOINT_PATTERN);
  const v1Events = endpointMatch && endpointMatch[1] === 'v1' && endpointMatch[2] === 'events';

  /** @type EmitterOptions */
  const defaults = {
    blockTransmit: false,
    clientName: 'javascript-sdk'
  };

  /** @type EmitterOptions */
  const opts = assign({}, defaults, omitUndefined(options));

  let blockTransmit = opts.blockTransmit;
  let messages = [];
  let timer;

  const prepData = function(data) {
    // iterate through data keys and uri encode any objects
    const preppedData = {};
    let parsedData = JSON.parse(data);
    for (let key in parsedData) {
      if (typeof parsedData[key] === 'object') {
        // Need to stringify as URLSearchParams will just print Object
        preppedData[key] = JSON.stringify(parsedData[key]);
      } else {
        preppedData[key] = parsedData[key];
      }
    }

    return preppedData;
  }

  function send(url, data, sync, usePost = false) {
    if (typeof window !== 'undefined' && window.fetch && !!URLSearchParams) {
      let options = {
        method: 'GET',
        keepalive: true,
        cache: 'no-cache'
      };

      let fetchUrl = url;
      if (usePost) {
        options.method = 'POST';
        options.body = data;
      } else {
        let preppedData = prepData(data);
        let params = new URLSearchParams(preppedData).toString();
        fetchUrl = url + '?' + params;
      }

      window.fetch(fetchUrl, options)
        .then(function(response) {
          if (!response.ok) {
            console.error('Evolv: Unable to send event beacon - HTTP error! Status: ' + response.status);
            usePost ? fallbackBeacon(url, data, sync) : send(url, data, sync, true);
          }
        })
        .catch(function(err) {
          console.error('Evolv: Unable to send event beacon');
          console.error(err);
          usePost ? fallbackBeacon(url, data, sync) : send(url, data, sync, true);
        });
    } else {
      fallbackBeacon(url, data, sync);
    }
  }

  function wrapMessages(msgs) {
    return {
      uid: context.uid,
      client: opts.clientName,
      messages: msgs
    }
  }

  /**
   *
   */
  function transmit() {
    let sync = false;
    if (typeof this !== 'undefined' && this !== null) {
      const currentEvent = this.event && this.event.type;
      sync = currentEvent === 'unload' || currentEvent === 'beforeunload';
    }

    if (!messages.length || blockTransmit) {
      return;
    }

    let batch = messages;
    messages = [];
    if (timer) {
      clearTimeout(timer);
    }
    timer = undefined;

    if (v1Events) {
      // change needed to support v1 of the participants api
      batch.forEach(function(message) {
        let editedMessage = message.payload || {};
        editedMessage.type = message.type;
        const usePost = encodeURIComponent(JSON.stringify(editedMessage)).length > MAX_MESSAGE_SIZE;
        send(endpoint, JSON.stringify(editedMessage), sync, usePost);
      });
    } else {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (batch.length === 0) {
          break;
        }

        let reducedBatchSize = 0;
        let charCount = 0;
        for (let i = 0; i < (batch.length && BATCH_SIZE); i++) {
          charCount += encodeURIComponent(JSON.stringify(batch[i])).length;

          if (charCount > MAX_MESSAGE_SIZE) {
            break;
          }

          reducedBatchSize = i + 1;
        }

        const smallBatch = batch.slice(0, reducedBatchSize);

        // smallBatch would be 0 if the first message was too big
        // just grab the first message, and force send it with failover
        if (smallBatch.length === 0) {
          send(endpoint, JSON.stringify(wrapMessages([batch[0]])), sync, true);
          batch = batch.slice(1);
          continue;
        }

        send(endpoint, JSON.stringify(wrapMessages(smallBatch)), sync);
        batch = batch.slice(reducedBatchSize);
      }
    }

    if (messages.length) {
      timer = setTimeout(function() {transmit()}, DELAY);
    }
  }

  if (typeof window !== 'undefined') {
    /** @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event#sending_end-of-session_analytics_on_transitioning_to_hidden} */
    window.addEventListener("visibilitychange", function transmitData() {
      if (window.visibilityState === "hidden") {
        transmit();
      }
    });

    // This event is less reliable in when it is fired than visibilitychange - visibilitychange is not always present
    // in old browsers.
    // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon#sending_analytics_at_the_end_of_a_session
    window.addEventListener('pagehide', transmit);
  }

  this.unblockAndFlush = function() {
    blockTransmit = false;
    transmit();
  };

  this.emit = function(type, payload, flush) {
    messages.push({
      type: type,
      payload: payload,
      timestamp: Date.now()
    });

    if (flush) {
      transmit();
      return;
    }

    if (!timer) {
      timer = setTimeout(transmit, DELAY);
    }
  };

  this.flush = transmit;

  // This exists to clear messages in tests. There is no reason to call it in normal usage.
  this.clearMessages = function() {
    messages = [];
  }
}
