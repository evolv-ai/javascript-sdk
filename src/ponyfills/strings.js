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
