import retrieve from './retrieve.js';

const DELAY = 500;

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
    const currentEvent = this.event && this.event.type;
    const sync = currentEvent === 'unload' || currentEvent === 'beforeunload';

    if (!messages.length) {
      return;
    }

    const batch = messages;
    messages = [];
    if (timer) {
      clearTimeout(timer);
    }
    timer = undefined;
    const json = JSON.stringify(batch);
    if (!send(endpoint, json, sync)) {
      messages = batch;
      console.error('Evolv: Unable to send beacon');
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('unload', transmit);
    window.addEventListener('beforeunload', transmit);
  }

  this.emit = function(type, data, flush) {
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
