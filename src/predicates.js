import base64 from './ponyfills/base64.js';
import * as strings from './ponyfills/strings.js';

const AND = 'and';
const OR = 'or';

const FILTER_OPERATORS = {
  contains: function(a, b) { return a !== undefined && a.indexOf(b) >= 0; },
  defined: function(a) { return a !== undefined; },
  equal: function(a, b) { return a === b; },
  exists: function(a) { return a !== null && a !== undefined }, // Check that the key exists in the dictionary object
  greater_than: function(a, b) { return a > b; },
  greater_than_or_equal_to: function(a, b) { return a >= b; },
  is_true: function(a) { return a === true },
  is_false: function(a) { return a === false },
  not_exists: function(a) { return a === null || a === undefined }, // Check that the key does not exists in the dictionary object
  not_contains: function(a, b) { return a !== undefined && !(a.indexOf(b) >= 0); },
  not_defined: function(a) { return a === undefined; },
  not_equal: function(a, b) { return a !== b; },
  not_regex_match: function(value, pattern) { return value && !value.match(pattern); },
  not_regex64_match: function(value, pattern) { return !regex64Match(value, pattern) },
  not_starts_with: function(a, b) { return !strings.startsWith(a, b); },
  kv_contains: function(obj, params) { return (params[0] in obj) && (obj[params[0]].indexOf(params[1]) >= 0) },
  kv_equal: function(obj, params) { return obj[params[0]] === params[1]; },
  kv_not_contains: function(obj, params) { return !((params[0] in obj) && (obj[params[0]].indexOf(params[1]) >= 0)); },
  kv_not_equal: function(obj, params) { return obj[params[0]] !== params[1]; },
  less_than: function(a, b) { return a < b; },
  less_than_or_equal_to: function(a, b) { return a <= b; },
  loose_equal: function(a, b) { return a == b; },
  loose_not_equal: function(a, b) { return a != b; },
  regex_match: function(value, pattern) { return value && value.match(pattern); },
  regex64_match: regex64Match,
  starts_with: function(a, b){ return strings.startsWith(a, b); }
};

function regexFromString (string) {
  if (!strings.startsWith(string, '/')) {
    return new RegExp(string);
  }

  const split = string.lastIndexOf('/');
  return new RegExp(string.substring(1, split), string.substring(split + 1));
}

function regex64Match(value, b64pattern) {
  try {
    const string = base64.decode(b64pattern);
    return value && value.match(regexFromString(string)) !== null;
  } catch (e) {
    return false;
  }
}

function valueFromKey(context, key) {
  if (context === undefined) {
    return undefined;
  }

  const nextToken = key.indexOf('.');
  if (nextToken === 0) {
    throw new Error('Invalid variant key: ' + key);
  }

  if (nextToken === -1) {
    return key in context ? context[key] : undefined;
  }

  return valueFromKey(context[key.substring(0, nextToken)], key.substring(nextToken + 1));
}

function evaluateFilter(user, rule) {
  const value = valueFromKey(user, rule.field);

  if (strings.startsWith(rule.operator, 'kv_') && !value) {
    return false;
  }

  // Evaluates a single filter rule against a user.
  return !!FILTER_OPERATORS[rule.operator](value, rule.value);
}


function evaluateRule(user, query, rule, passedRules, failedRules) {
  let result;
  if ('combinator' in rule) {
    // No need to add groups to pass/failed rule sets here. Their children results will be merged up
    // via recursion.
    // eslint-disable-next-line no-use-before-define
    return evaluatePredicate(user, rule, passedRules, failedRules);
  } else {
    result = evaluateFilter(user, rule);
  }

  // Any other rule is also a terminating branch in our recursion tree, so we add rule id to pass/fail rule set
  (result ? passedRules : failedRules).add({
    id: query.id,
    index: rule.index,
    field: rule.field
  });

  return result;
}


function evaluatePredicate(user, query, passedRules, failedRules) {
  const rules = query.rules;

  if (!rules) {
    return true;
  }

  for (let i = 0; i < rules.length; i++) {
    const passed = evaluateRule(user, query, rules[i], passedRules, failedRules);
    if (passed && query.combinator === OR) {
      return true;
    }

    if (!passed && query.combinator === AND) {
      return false;
    }
  }

  // If we've reached this point on an 'or' all rules failed.
  return query.combinator === AND;
}

/**
 * @typedef EvaluationResult
 * @property {Set<object>} passed
 * @property {Set<object>} failed
 * @property {boolean} rejected
 * @property {Set<string>} touched
 */

/**
 * Evaluates a query against a user object and saves passing/failing rule ids to provided sets.
 * @param context A context object containing describing the context the predicate should be evaluated against.
 * @param predicate Nested predicate object that rules structured into groups as a deeply nested tree.
 *                  note: There is no set limit to the depth of this tree, hence we must work with it
 *                  using recursion.
 * @returns {EvaluationResult}
 */
export function evaluate(context, predicate) {
  const result = {
    passed: new Set(),
    failed: new Set(),
    touched: new Set()
  };

  result.rejected = !evaluatePredicate(context, predicate, result.passed, result.failed);

  result.passed.forEach(function(item) {
    result.touched.add(item.field);
  });

  result.failed.forEach(function(item) {
    result.touched.add(item.field);
  });

  return result;
}
