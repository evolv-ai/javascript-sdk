import MiniPromise from '../../ponyfills/minipromise.js';
import { createSignatureHeader } from './create-signature-header.js';


const URL_PATTERN = /^([a-z]+):\/\/([^/]+)(.*)/i;

export default function nodeRequest(options) {
  return MiniPromise.createPromise(function(resolve, reject) {
    let response = '';
    const parts = URL_PATTERN.exec(options.url);

    if (!parts) {
      throw new Error('Evolv: Invalid endpoint URL');
    }

    const schema = parts[1];
    (schema === 'http' ? import('http') : import('https')).then(function (http) {
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
        res.on('data', function(chunk) {
          response += chunk;
        });
        res.on('end', function() {
          if (res.statusCode === 200) {
            resolve(JSON.parse(response));
          } else if (res.statusCode === 202) {
            resolve();
          } else {
            const message = 'Evolv: Invalid status ' + res.statusCode + ' for response ' + res.statusMesssage;
            reject(message);
          }
        });
      });

      req.on('error', reject);
      req.write(options.payload);
      req.end();
    });
  });
}
