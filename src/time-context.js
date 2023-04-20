const MINUTE_IN_MILLIS = 60 * 1000;

const MINUTES = [
    {key: ['time', 'minute'], value: 'getMinutes'},
    {key: ['utc', 'time', 'minute'], value: 'getUTCMinutes'}
];
const HOURS = [
    {key: ['time', 'hour'], value: 'getHours'},
    {key: ['utc', 'time', 'hour'], value: 'getUTCHours'},
    {key: ['hourOfDay'], value: 'getHours'},
    {key: ['utc', 'hourOfDay'], value: 'getUTCHours'}
];
const DAYS = [
    {key: ['date', 'day'], value: 'getDate'},
    {key: ['utc', 'date', 'day'], value: 'getUTCDate'},
    {key: ['dayOfWeek'], value: 'getDay'},
    {key: ['utc', 'dayOfWeek'], value: 'getUTCDay'}
];
const MONTHS = [
    {key: ['date', 'month'], value: 'getMonth', transform: function(v) { return v+1; }},
    {key: ['utc', 'date', 'month'], value: 'getUTCMonth', transform: function(v) { return v+1; }}
];
const YEARS = [
    {key: ['date', 'year'], value: 'getFullYear'},
    {key: ['utc', 'date', 'year'], value: 'getUTCFullYear'}
];

const UNITS = [MINUTES, HOURS, DAYS, MONTHS, YEARS];


function setValue(obj, date, depth, unit) {
    const k = unit.key[depth];
    if (depth === unit.key.length - 1) {
      obj[k] = unit.transform ? unit.transform(date[unit.value]()) : date[unit.value]();
      return;
    }

    let v = obj[k];
    if (!v) {
      v = {};
      obj[k] = v;
    }

    setValue(v, date, depth+1, unit);
}

/**
 * Adds the current date and time to the context.
 * @param {Context} context The context to add the date and time to.
 * @param {boolean} continueTimeUpdate If true, the context will be updated every minute. Defaults to true.
**/
export function addDateTimeToContext(context, continueTimeUpdate) {
    if (typeof continueTimeUpdate === 'undefined') {
      continueTimeUpdate = true;
    }

    let lastDate;
    function updateDate(currentDate) {
        const updateValue = {};
        // Set any values that need to be updated in the updateValue object
        const contextualSetValue = setValue.bind(null, updateValue, currentDate, 0);
        UNITS.some(function(v) {
            let vFn = v[0].value;
            if (lastDate && lastDate[vFn]() === currentDate[vFn]()) {
                return true;
            }

            v.forEach(contextualSetValue);
        });

        context.update(updateValue, true);

        lastDate = currentDate;
    }

    let initialDate = new Date();
    // delay the start to aline to the next minute + 1 millisecond
    const delayStart = Math.ceil(initialDate.getTime()/MINUTE_IN_MILLIS)*MINUTE_IN_MILLIS - initialDate.getTime() + 1;
    updateDate(initialDate);

    if (!continueTimeUpdate) {
      return;
    }

    setTimeout(function() {
        let currentDate = new Date();
        updateDate(currentDate);
        setInterval(updateDate, MINUTE_IN_MILLIS);
    }, delayStart);
}