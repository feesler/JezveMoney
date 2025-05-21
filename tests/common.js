import { isDate, isObject } from '@jezvejs/types';
import { assert } from '@jezvejs/assert';
import {
    formatDate,
    parseDateString,
    getLocaleDateFormat,
    shiftDate,
    shiftYear,
    getDaysInMonth,
} from '@jezvejs/datetime';
import { fixFloat } from '@jezvejs/number';

export const MS_IN_SECOND = 1000;
export const DAYS_IN_WEEK = 7;
export const MONTHS_IN_YEAR = 12;

export const SORT_BY_CREATEDATE_ASC = 1;
export const SORT_BY_CREATEDATE_DESC = 2;
export const SORT_BY_NAME_ASC = 3;
export const SORT_BY_NAME_DESC = 4;
export const SORT_MANUALLY = 5;

export const availSortTypes = [
    SORT_BY_CREATEDATE_ASC,
    SORT_BY_CREATEDATE_DESC,
    SORT_BY_NAME_ASC,
    SORT_BY_NAME_DESC,
    SORT_MANUALLY,
];

/** Schedule interval types */
export const INTERVAL_NONE = 0;
export const INTERVAL_DAY = 1;
export const INTERVAL_WEEK = 2;
export const INTERVAL_MONTH = 3;
export const INTERVAL_YEAR = 4;

/* Decimal values precision */
export const DEFAULT_PRECISION = 2;
export const EXCHANGE_PRECISION = 4;
export const MAX_PRECISION = 8;

/* Limit for PHP error message */
const MAX_PHP_ERROR_LENGTH = 200;
/* PHP error signatures */
const errSignatures = [
    '<b>Notice</b>',
    '<b>Warning</b>',
    '<b>Parse error</b>',
    '<b>Fatal error</b>',
    '<b>Deprecated</b>',
    'xdebug-error',
];

/** Return timestamp for the start of the day */
export const cutDate = (value) => {
    const date = (typeof value === 'number') ? (new Date(value)) : value;
    if (!isDate(date)) {
        return null;
    }

    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
};

/** Converts timestamp to seconds */
export const timeToSeconds = (timestamp) => {
    assert(timestamp, 'Invalid timestamp');
    return timestamp / MS_IN_SECOND;
};

/** Converts Date instance to seconds */
export const dateToSeconds = (date) => {
    const ms = cutDate(date);
    return timeToSeconds(ms);
};

/** Converts date string to seconds */
export const dateStringToSeconds = (dateStr, params = {}) => {
    const date = parseDateString(dateStr, params);
    return (isDate(date)) ? dateToSeconds(date) : null;
};

/** Converts seconds to timestamp */
export const secondsToTime = (seconds) => {
    assert.isInteger(seconds, `Invalid seconds value: ${seconds}`);
    return seconds * MS_IN_SECOND;
};

/** Converts seconds to Date instance */
export const secondsToDate = (seconds) => (
    new Date(secondsToTime(seconds))
);

/** Converts seconds to date string */
export const secondsToDateString = (seconds, params = {}) => {
    assert.isInteger(seconds, `Invalid seconds value: ${seconds}`);
    return formatDate(secondsToDate(seconds), params);
};

/** Convert Date object, timestamp or date string to the timestamp of the start of day */
export const fixDate = (date, params = {}) => {
    if (isDate(date)) {
        return cutDate(date);
    }

    if (typeof date === 'number') {
        return cutDate(new Date(date));
    }

    const res = dateStringToSeconds(date, params);
    return (res === null) ? null : (res * MS_IN_SECOND);
};

/** Returns date string with days and month in 2-digit format */
export const formatInputDate = (date, params = {}) => {
    assert.isDate(date);

    const format = getLocaleDateFormat(params);
    const inputFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: (format.yearLength === 2) ? '2-digit' : 'numeric',
    };

    return formatDate(date, {
        locales: params?.locales ?? [],
        options: inputFormatOptions,
    });
};

/** Parses date from string and format it back */
export const reformatDate = (str, params = {}) => {
    const fixedDate = fixDate(str, params);
    if (!fixedDate) {
        return str;
    }

    return formatInputDate(new Date(fixedDate), params);
};

export const renderMonth = (value, params = {}) => {
    const date = secondsToDate(value);
    const monthName = formatDate(date, {
        locales: params?.locales ?? [],
        options: { month: 'long' },
    });

    return `${monthName} ${date.getFullYear()}`;
};

export const stepInterval = (timestamp, intervalType, step = 1) => {
    assert(timestamp, 'Invalid timestamp');
    assert(step >= 0, 'Invalid interval step');

    const dayStart = cutDate(timestamp);
    if (step === 0 || intervalType === INTERVAL_NONE) {
        return dayStart;
    }

    const date = new Date(dayStart);

    if (intervalType === INTERVAL_DAY) {
        const targetDate = shiftDate(date, step);
        return targetDate.getTime();
    }

    if (intervalType === INTERVAL_WEEK) {
        const targetWeek = shiftDate(date, step * DAYS_IN_WEEK);
        return targetWeek.getTime();
    }

    if (intervalType === INTERVAL_MONTH) {
        const targetMonth = new Date(Date.UTC(
            date.getFullYear(),
            date.getMonth() + step,
            1,
        ));
        const maxDate = getDaysInMonth(targetMonth);

        return Date.UTC(
            date.getFullYear(),
            date.getMonth() + step,
            Math.min(date.getDate(), maxDate),
        );
    }

    if (intervalType === INTERVAL_YEAR) {
        return shiftYear(date, step);
    }

    throw new Error('Invalid type of interval');
};

/** Format specified value */
export const formatValue = (val) => val.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ');

/*
* Normalized decimal calculations
*/

/** Correct calculated value */
export const correct = (val, prec = DEFAULT_PRECISION) => parseFloat(parseFloat(val).toFixed(prec));

/** Correct calculated exchange rate value */
export const correctExch = (val) => correct(val, EXCHANGE_PRECISION);

/** Normalize monetary value from string */
export const normalize = (val, prec = DEFAULT_PRECISION) => (
    parseFloat(parseFloat(fixFloat(val)).toFixed(prec))
);

/** Normalize exchange rate value from string */
export const normalizeExch = (val) => Math.abs(normalize(val, EXCHANGE_PRECISION));

/** Check value is valid */
export const isValidValue = (val) => (
    typeof val !== 'undefined' && val !== null && !Number.isNaN(parseFloat(fixFloat(val)))
);

/** Return number of digits after the decimal point */
export const digitsAfterPoint = (val) => {
    const fixed = fixFloat(val);
    const float = parseFloat(fixed);
    const integer = Math.trunc(float);
    const intPart = (fixed < 0 && integer === 0) ? '-0' : integer.toString();
    return fixed.length - intPart.length - 1;
};

/** Cuts minus sign if 'allowNegative' is disabled and returns result */
const handleNegative = (val, allowNegative) => {
    const strVal = val.toString();
    return (!allowNegative && strVal.startsWith('-')) ? strVal.substring(1) : strVal;
};

/** Trims string value of decimal to specified number of digits after decimal point */
export const trimToDigitsLimit = (val, limit, allowNegative = true) => {
    const digits = digitsAfterPoint(val);
    const length = (digits === 0) ? 0 : (digits + 1);
    const diff = (limit === 0) ? length : (digits - limit);
    const trimmed = (diff > 0)
        ? val.substring(0, val.length - diff)
        : val;

    return handleNegative(trimmed, allowNegative);
};

/**
 * Returns options object for number format
 * @param {object} param0
 * @param {number} param0.precision - number of fractional digits
 * @returns {object}
 */
export const getNumberFormatOptions = ({ precision }) => ({
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
});

/*
* Other
*/

/** Quote string for CSV */
const quoteString = (str) => {
    const escaped = str.toString().split('"').join('\\"');

    return `"${escaped}"`;
};

/** Return CSV */
export function createCSV({
    header = null,
    data = [],
    delimiter = ';',
    newLine = '\r\n',
}) {
    let rows = [];

    assert.isString(delimiter, 'Invalid parameters');
    assert.isString(newLine, 'Invalid parameters');
    assert.isArray(data, 'Invalid parameters');

    if (Array.isArray(header)) {
        rows.push(header);
    }

    rows = rows.concat(data);

    const res = rows.map(
        (row) => row.map(quoteString).join(delimiter),
    ).join(newLine).trim();

    return `${res}${newLine}`;
}

export const formatProps = (params) => (
    JSON.stringify(params) ?? 'undefined'
);

export const checkPHPerrors = (content) => {
    if (!content) {
        return;
    }

    errSignatures.forEach((item) => {
        const itemPosition = content.indexOf(item);
        const errorContent = (itemPosition !== -1)
            ? content.substring(itemPosition, itemPosition + MAX_PHP_ERROR_LENGTH)
            : '';

        assert(itemPosition === -1, `PHP error signature found: '${errorContent}'`);
    });
};

/** Returns random integer id */
export const generateId = () => Math.round(Math.random() * 10000);

/** Returns copy of specified object with properties existing in expected object */
export function getExpectedValues(control, expected) {
    assert(control, 'Invalid control');
    assert(expected, 'Invalid expected value');

    const res = {};

    const expectedKeys = Object.getOwnPropertyNames(expected);
    for (const key of expectedKeys) {
        const expValue = expected[key];
        const realValue = (control.checkValues)
            ? control.content[key]
            : control[key];

        if (isObject(expValue)) {
            res[key] = getExpectedValues(realValue, expValue);
        } else {
            res[key] = realValue;
        }
    }

    return res;
}

/**
 * Check all specified properties are presents in an object
 * @param {Object} obj - object to check
 * @param {Array} propNames - array of props to check
 */
export const checkFields = (obj, propNames) => (
    obj
    && propNames
    && propNames.every((f) => (f in obj))
);

/**
 * Returns new object with specified properties from source object
 *
 * @param {Object} source - source object
 * @param {Array} propNames - array of props to copy
 */
export const copyFields = (source, propNames) => {
    assert(source && propNames, 'Invalid parameters');

    const res = {};
    propNames.forEach((f) => {
        if (f in source) {
            res[f] = structuredClone(source[f]);
        }
    });

    return res;
};
