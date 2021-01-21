import deepmerge from 'deepmerge';

export const deepMerge = deepmerge;
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if a variable is an Object. This function considers Null and Array to not be Objects.
 *
 * @param variable The variable that is to tested
 * @returns {boolean} True if the variable is an object
 */
export function isObject(variable) {
  return typeof variable === 'object' && variable !== null && !Array.isArray(variable);
}

/**
 * Convert a hierarchical map into a flattened map
 *
 * @param {Object} map A map with hierarchical keys
 * @returns {Object} A map with hierarchical keys flattened
 */
export function flatten(map, filter) {
  function recurse(current, parent_key) {
    let items = {};
    Object.keys(current).filter(filter || function() { return true; }).forEach(function(k) {
      let v = current[k];
      let new_key = parent_key ? (parent_key + '.' + k) : k;
      if (isObject(v)) {
        items = assign(items, recurse(current[k], new_key));
      } else {
        items[new_key] = v;
      }
    });

    return items;
  }

  return recurse(map, '');
}

export function flattenKeys(map, filter) {
  function recurse(current, parent_key) {
    let items = [];
    Object.keys(current).filter(filter || function() { return true; }).forEach(function(k) {
      let v = current[k];
      let new_key = parent_key ? (parent_key + '.' + k) : k;
      items.push(new_key);
      if (isObject(v)) {
        items = items.concat(recurse(current[k], new_key));
      }
    });

    return items;
  }

  return recurse(map, '');
}

export function removeValueForKey(key, map) {
  function recurse(keys, index, map) {
    let key = keys[index];
    if (index === (keys.length - 1)) {
      delete map[key];
      return true;
    }

    if (!(key in map)) {
      return false;
    }

    const removed = recurse(keys, index + 1, map[key]);
    if (removed && Object.keys(map[key]).length === 0) {
      delete map[key];
    }

    return removed;
  }

  return recurse(key.split('.'), 0, map);
}

export function getValueForKey(key, map) {
  let value;
  let current = map;
  let keys = key.split('.');
  for (let i = 0; i < keys.length; i++) {
    let k = keys[i];
    if (i === (keys.length - 1)) {
      value = current[k];
      break;
    }

    if (!(k in current)) {
      break;
    }

    current = current[k];
  }

  return value;
}

export function setKeyToValue(key, value, map) {
  let current = map;
  let keys = key.split('.');
  for (let i = 0; i < keys.length; i++) {
    let k = keys[i];
    if (i === (keys.length - 1)) {
      current[k] = value;
      break;
    }

    if (!(k in current)) {
      current[k] = {};
    }

    current = current[k];
  }

  return value;
}

/**
 * Convert a flattened map into a hierarchical map
 *
 * @param {Object} map A map with hierarchical keys flattened
 * @returns {Object} A map with hierarchical keys
 */
export function expand(map) {
  let expanded = {};
  Object.keys(map).forEach(function(key) {
    let v = map[key];
    setKeyToValue(key, v, expanded);
  });

  return expanded;
}

export function prune(map, active) {
  const pruned = {};
  active.forEach(function (key) {
    const keyParts = key.split('.');
    let current = map;
    for (let i = 0; i < keyParts.length; i++) {
      let now = current[keyParts[i]];
      if (now) {
        if (i === keyParts.length - 1) {
          pruned[key] = now;
          break;
        }
        current = now;
      } else {
        break;
      }
    }
  })

  reattributePredicatedValues(pruned, active);
  return pruned;
}

export function reattributePredicatedValues(pruned, active) {
  function reattribute(o, a, collected) {
    if (typeof o !== 'object' || o === null) {
      return o;
    }

    if (o._predicated_values) {
      const predicatedKeyPrefix = collected.join('.')
      for (let i = 0; i < o._predicated_values.length; i++) {
        if (a.has(predicatedKeyPrefix + '.' + o._predicated_values[i]._assignment_id)) {
          return o._predicated_values[i]._value;
        }
      }
      if (a.has(predicatedKeyPrefix + '.default')) {
        return o._default_value;
      }
      return null;
    }

    const keys = Object.keys(o)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const newCollected = collected.concat([key])
      o[key] = reattribute(o[key], a, newCollected)
    }

    return o;
  }

  reattribute(pruned, active, [])
}

export function filter(map, active) {
  const pruned = prune(map, active)
  return expand(pruned)
}

/*eslint no-unused-vars: ["error", { "argsIgnorePattern": "sources" }]*/
export function assign(target, sources) {
  if (Object.assign) {
    return Object.assign.apply(undefined, arguments);
  }

  if (target === null || target === undefined) {
    throw new TypeError('Cannot convert undefined or null to object');
  }

  const to = Object(target);

  for (let index = 1; index < arguments.length; index++) {
    let nextSource = arguments[index];

    if (nextSource !== null && nextSource !== undefined) {
      for (let nextKey in nextSource) {
        // Avoid bugs when hasOwnProperty is shadowed
        // eslint-disable-next-line no-prototype-builtins
        if (nextSource.hasOwnProperty(nextKey)) {
          to[nextKey] = nextSource[nextKey];
        }
      }
    }
  }

  return to;
}
