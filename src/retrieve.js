import MiniPromise from './ponyfills/minipromise.js';
import base64 from './ponyfills/base64.js';
import { assign } from './ponyfills/objects.js';
import request from './helpers/requests/index.js';


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
			.then(function(cryptoKey) {
				cryptoOperationToPromise(crypto.subtle.sign(algorithm, cryptoKey, payload))
					.then(function(bytes) {
						resolve(base64.encodeFromArrayBuffer(bytes));
					})
					.catch(reject);
			})
			.catch(reject);
	});
}

/**
 * @typedef RetrieveOptions
 * @property {string} method
 * @property {string} url
 * @property {string} keyId
 * @property {string} key
 * @property {object|*} [data]
 * @property {string} [encoding]
 */

/**
 * @param {RetrieveOptions} opts
 * @param {RequestHooks} [hooks]
 * @returns {Promise<unknown> | MiniPromise}
 */
export default function retrieve(opts, hooks) {
	const options = (hooks && typeof hooks.beforeOptions === 'function')
		? hooks.beforeOptions(opts)
		: opts;

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

		if (!completeOptions.key) {
			request(completeOptions)
				.then(resolve)
				.catch(reject);
			return;
		}

		sign(completeOptions.key, str2ab(completeOptions.payload))
			.then(function(signature) {
				request(assign({ signature: signature }, completeOptions))
					.then(resolve)
					.catch(reject);
			})
			.catch(reject);
	});
}
