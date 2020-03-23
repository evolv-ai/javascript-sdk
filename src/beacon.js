const DELAY = 1000;

const URL_PATTERN = /^([a-z]+):\/\/([a-z\-_\.]+)(\/.*)/i;

function xhrSendJsonBeacon(url, data, sync) {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', url, !sync);
  xhr.withCredentials = true;
  xhr.setRequestHeader('Accept', '*/*');
  xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

  try {
    xhr.send(data);
  } catch (e) {
    return false;
  }

  return true;
}

function nodeSendBeacon(url, data) {
  const parts = URL_PATTERN.exec(url);
  if (!parts) {
    throw new Error('Evolv: Invalid beacon URL');
  }

  import('http').then(function(http) {
    const schema = parts[1];
    const hostname = parts[2];
    const path = parts[3];
    const req = http.request({
      hostname: hostname,
      port: schema === 'http' ? 80 : 443,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Accept': '*/*',
        'Content-Length': Buffer.byteLength(data)
      }
    });
    req.write(data);
    req.end();
  });

  return true;
}

export default function Emitter(endpoint) {
  let messages = [];
  let timer;

  let send;
  if (typeof window !== 'undefined' && window.navigator.sendBeacon) {
    send = window.navigator.sendBeacon;
  } else if (typeof XMLHttpRequest !== 'undefined') {
    send = xhrSendJsonBeacon;
  } else {
    send = nodeSendBeacon;
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
      timer = setTimeout(transmit, DELAY);
      console.error('Evolv: Unable to send beacon');
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
