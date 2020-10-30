/**
 * Method determines whether a string begins with the characters of a specified string,
 * returning true or false as appropriate.
 *
 * @param string The string to be tested
 * @param searchString The characters to be searched for at the start of this string.
 * @param position The position in this string at which to begin searching for searchString. Defaults to 0
 * @returns {boolean} True if the given characters are found at the beginning of the string; otherwise, false.
 */
export function startsWith(string, searchString, position) {
	if (string.startsWith) {
		return string.startsWith(searchString, position);
	}
	const pos = position > 0 ? position|0 : 0;
	return string.substring(pos, pos + searchString.length) === searchString;
}

/**
 * Method determines whether a string ends with the characters of a specified string,
 * returning true or false as appropriate.
 *
 * @param string The string to be tested
 * @param searchString The characters to be searched for at the end of this string.
 * @param length The length of the tested string. Defaults to length of string to be tested
 * @returns {boolean} True if the given characters are found at the end of the string; otherwise, false.
 */
export function endsWith(string, searchString, length) {
	if (string.endsWith) {
		return string.endsWith(searchString, length);
	}
	const len = length === undefined || length > string.length ? string.length : length;
	return this.substring(len - searchString.length, len) === searchString;
}
