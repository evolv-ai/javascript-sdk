import retrieve from './retrieve.js';

const DELAY = 1;

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

export default function Emitter(endpoint) {
  let messages = [];
  let timer;

  let send;
  if (typeof window !== 'undefined' && window.navigator.sendBeacon) {
    send = window.navigator.sendBeacon;
  } else {
    send = fallbackBeacon;
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
      if (!send(endpoint, JSON.stringify(message), sync)) {
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
