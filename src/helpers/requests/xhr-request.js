import MiniPromise from '../../ponyfills/minipromise.js';
import { createSignatureHeader } from './create-signature-header.js';


export default function xhrRequest(options) {
	return MiniPromise.createPromise(function(resolve, reject) {
		const xhr = new XMLHttpRequest();

		xhr.addEventListener('load', function() {
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
		xhr.open(options.method, options.url, !options.sync);

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
