export function from(items) {
	if (Array.isArray(items)) {
		return items;
	}

	if (items instanceof Map) {
		const arr = [];

		items.forEach((value, key) => {
			arr.push([key, value]);
		});

		return arr;
	}

	if (items instanceof Set || items instanceof NodeList) {
		const arr = [];

		// IE11 does not support NodeList.forEach()
		(items.forEach || forEach).call(items, (item) => {
			arr.push(item);
		});

		return arr;
	}

	return [];
}

/**
 * Shim for NodeList.forEach()
 */
function forEach(items, callback, thisArg) {
	thisArg = thisArg || window;

	for (let i = 0; i < items.length; i += 1) {
		callback.call(thisArg, items[i], items);
	}
}
