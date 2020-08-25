/**
 * Returns a copy of a set and optionally copies from one set into another.
 *
 * @description
 * This helper function is necessary because IE11 does not support the copy
 * constructor signature of new Set().
 *
 * @param {Set|Array} from Set to copy from
 * @param {Set} [into] If provided, items from `from` will be copied into `into`. Otherwise a new set is created.
 *
 * @returns {Set}
 */
export function copySet(from, into) {
    const copy = into || new Set();

    from.forEach(function(item) {
        copy.add(item);
    });

    return copy;
}
