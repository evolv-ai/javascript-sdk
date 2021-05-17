import MiniPromise from './ponyfills/minipromise.js';
import base64 from './ponyfills/base64.js';
import { assign } from './ponyfills/objects.js';

const URL_PATTERN = /^([a-z]+):\/\/([^/]+)(.*)/i;

function cryptography() {
  // eslint-disable-next-line no-undef
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
export function str2ab(str) {
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
 * @returns {PromiseLike} A promise
 */
function cryptoOperationToPromise(op) {
  if (op.then) {
    return op;
  }

  return MiniPromise.createPromise(function(resolve, reject) {
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

  return MiniPromise.createPromise(function(resolve, reject) {
    cryptoOperationToPromise(crypto.subtle.importKey(keyFormat, str2ab(key), algorithm, true, keyUsages))
      .then(function (cryptoKey) {
        cryptoOperationToPromise(crypto.subtle.sign(algorithm, cryptoKey, payload))
          .then(function(bytes) {
            resolve(base64.encodeFromArrayBuffer(bytes));
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
  return MiniPromise.createPromise(function(resolve, reject) {
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
        const message = 'Evolv: Invalid status ' + this.status + ' for response ' + this.responseText;
        console.error(message);
        reject(message);
      }
    });
    xhr.addEventListener('error', reject);
    xhr.open(options.method, options.url, options.sync);
    if (options.method.toUpperCase() === 'POST' || options.method.toUpperCase() === 'PUT') {
      xhr.setRequestHeader('Content-Type', options.encoding);
    }
    xhr.setRequestHeader('Accept', 'application/json');
    if (options.signature) {
      xhr.setRequestHeader('Signature', createSignatureHeader(options.keyId, options.signature));
    }
    xhr.send(options.payload);
  });
}

function nodeRequest(options) {
  const self = this;

  return MiniPromise.createPromise(function(resolve, reject) {
    const parts = URL_PATTERN.exec(options.url);
    if (!parts) {
      throw new Error('Evolv: Invalid endpoint URL');
    }

    const schema = parts[1];
    self && (schema === 'http' ? self.import('http') : self.import('https')).then(function (http) {
      const hostname = parts[2];
      const path = parts[3];
      const headers = {
        'Content-Type': options.encoding,
        'Accept': 'application/json',
        // eslint-disable-next-line no-undef
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

export default function retrieve(options) {
  return MiniPromise.createPromise(function(resolve, reject) {
    const completeOptions = assign({}, options);
    completeOptions.encoding = completeOptions.encoding || 'application/json; charset=UTF-8';

    let payload;
    if (!completeOptions.data) {
      payload = '';
    } else if (typeof completeOptions.data === 'object') {
      if (completeOptions.encoding === 'application/x-www-form-urlencoded') {
        payload = Object.keys(completeOptions.data).map(function(key) {
          return encodeURIComponent(key) + '=' + encodeURIComponent(completeOptions.data[key]);
        }).join('&');
      } else {
        payload = JSON.stringify(completeOptions.data);
      }
    } else {
      payload = completeOptions.data;
    }
    completeOptions.payload = payload;

    let rx;
    if (typeof XMLHttpRequest !== 'undefined') {
      rx = xhrRequest;
    } else {
      rx = nodeRequest;
    }

    if (!completeOptions.key) {
      rx(completeOptions)
        .then(resolve)
        .catch(reject);
      return;
    }

    sign(completeOptions.key, str2ab(completeOptions.payload))
      .then(function (signature) {
        rx(assign({signature:signature}, completeOptions))
          .then(resolve)
          .catch(reject);
      })
      .catch(reject);
  });
}
