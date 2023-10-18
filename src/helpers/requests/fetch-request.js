import MiniPromise from '../../ponyfills/minipromise.js';
import { createSignatureHeader } from './create-signature-header.js';


const URL_PATTERN = /^([a-z]+):\/\/([^/]+)(.*)/i;


export default function fetchRequest(options) {
  return MiniPromise.createPromise(function(resolve, reject) {
    const parts = URL_PATTERN.exec(options.url);

    if (!parts) {
      throw new Error('Evolv: Invalid endpoint URL');
    }

    const headers = {
      'Content-Type': options.encoding,
      'Accept': 'application/json',
    };

    if (options.signature) {
      headers['Signature'] = createSignatureHeader(options.keyId, options.signature);
    }

    /** @type {RequestInit} */
    const requestInit = {
      url: options.url,
      method: options.method,
      headers: headers
    };

    if (options.method.toUpperCase() === 'POST' || options.method.toUpperCase() === 'PUT') {
      // eslint-disable-next-line no-undef
      headers['Content-Length'] = Buffer.byteLength(options.payload);
      requestInit.body = options.payload;
    }

    fetch(options.url, requestInit)
      .then(function (res) {
        if (res.status === 200) {
          resolve(res.json());
        } else if (res.status === 202) {
          resolve();
        } else {
          const message = 'Evolv: Invalid status ' + res.status + ' for response ' + res.statusText;
          reject(message);
        }
      })
      .catch(reject);
  });
}
