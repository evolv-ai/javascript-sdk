export function fromArray(items) {
  if (Array.isArray(items)) {
    return items;
  }

  if (items instanceof Map) {
    const arr = [];

    items.forEach(function(value, key) {
      arr.push([key, value]);
    });

    return arr;
  }

  if (items instanceof Set || items instanceof NodeList) {
    const arr = [];

    // IE11 does not support NodeList.forEach()
    (items.forEach || forEach).call(items, function(item) {
      arr.push(item);
    });

    return arr;
  }

  return [];
}

/**
 * Shim for NodeList.forEach()
 */
function forEach(callback, thisArg) {
  thisArg = thisArg || window;

  for (let i = 0; i < this.length; i += 1) {
    callback.call(thisArg, this[i], this);
  }
}
