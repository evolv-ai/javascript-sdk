import MiniPromise from './ponyfills/minipromise.js';
import base64 from './ponyfills/base64.js';
import { assign} from './ponyfills/objects.js';

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
 * @returns {{PromiseLike} A promise
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
        console.error('Evolv: Invalid status ' + this.status + ' for response ' + this.responseText);
        reject(msg);
      }
    });
    xhr.addEventListener('error', reject);
    xhr.open(options.method, options.url, options.sync);
    // TODO: use correct encoding, avoid CORS errors: No 'Access-Control-Allow-Origin' header is present on the requested resource.
    // xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.setRequestHeader('Accept', 'application/json');
    if (options.signature) {
      xhr.setRequestHeader('Signature', createSignatureHeader(options.keyId, options.signature));
    }
    xhr.send(options.payload);
  });
}

function nodeRequest(options) {
  return MiniPromise.createPromise(function(resolve, reject) {
    const parts = URL_PATTERN.exec(options.url);
    if (!parts) {
      throw new Error('Evolv: Invalid endpoint URL');
    }

    const schema = parts[1];
    (schema === 'http' ? import('http') : import('https')).then(function (http) {
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

export default function retrieve(options) {
  return MiniPromise.createPromise(function(resolve, reject) {
    let payload;
    if (!options.data) {
      payload = '';
    } else if (typeof options.data === 'object') {
      payload = JSON.stringify(options.data);
    } else {
      payload = options.data;
    }
    options = assign({ payload:  payload }, options);

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
        rx(assign({signature:signature}, options))
          .then(resolve)
          .catch(reject);
      })
      .catch(reject);
  });
}
