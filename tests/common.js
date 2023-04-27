import {
    isDate,
    isObject,
    assert,
    formatDate,
    parseDateString,
    getLocaleDateFormat,
} from 'jezve-test';

export const MS_IN_SECOND = 1000;

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

/* Decimal values precision */
export const DEFAULT_PRECISION = 2;
export const EXCHANGE_PRECISION = 4;
export const MAX_PRECISION = 8;

/** Check object is empty */
export const isEmpty = (obj) => {
    if (typeof obj === 'object') {
        return Object.keys(obj).length === 0;
    }

    return true;
};

/** Return timestamp for the start of the day */
export const cutDate = (date) => {
    if (!isDate(date)) {
        return null;
    }

    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
};

/** Converts Date instance to seconds */
export const dateToSeconds = (date) => {
    const ms = cutDate(date);
    assert(ms, 'Invalid date');
    return ms / MS_IN_SECOND;
};

/** Converts date string to seconds */
export const dateStringToSeconds = (dateStr, params = {}) => {
    const date = parseDateString(dateStr, params);
    return (isDate(date)) ? dateToSeconds(date) : null;
};

/** Converts seconds to Date instance */
export const secondsToDate = (seconds) => {
    assert.isInteger(seconds, `Invalid seconds value: ${seconds}`);
    return new Date(seconds * MS_IN_SECOND);
};

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

/** Parses date from string and format it back */
export const reformatDate = (str, params = {}) => {
    const format = getLocaleDateFormat(params);
    const inputFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: (format.yearLength === 2) ? '2-digit' : 'numeric',
    };

    const fixedDate = fixDate(str, params);
    if (!fixedDate) {
        return str;
    }

    let res = formatDate(new Date(fixedDate), {
        locales: params?.locales ?? [],
        options: inputFormatOptions,
    });

    if (res.endsWith(format.separator)) {
        const length = res.lastIndexOf(format.separator);
        res = res.substring(0, length);
    }

    return res;
};

// Returns the ISO week of the date.
export const getWeek = (timestamp) => {
    const date = new Date(timestamp);
    date.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    // January 4 is always in week 1.
    const week1 = new Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    const diff = date.getTime() - week1.getTime();

    return 1 + Math.round((diff / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
};

/** Returns a new date shifted by the specified number of months */
export const shiftMonth = (date, shift) => (
    new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth() + shift,
        date.getDate(),
    ))
);

/** Returns a new date shifted by the specified number of days */
export const shiftDate = (date, shift) => (
    new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + shift,
    ))
);

/** Format specified value */
export const formatValue = (val) => val.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ');

/*
* Normalized decimal calculations
*/

/** Fix string to correct float number format */
export const fixFloat = (str) => {
    if (typeof str === 'number' && !Number.isNaN(str) && Number.isFinite(str)) {
        return str.toString();
    }
    if (typeof str !== 'string') {
        return null;
    }

    let res = str.replace(/,/g, '.');
    if (res.indexOf('-') === 0
        && (
            res.length === 1
            || res.indexOf('.') === 1
        )) {
        res = `-0${res.substring(1)}`;
    }
    if (res.indexOf('.') === 0 || !res.length) {
        res = `0${res}`;
    }
    return res;
};

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

/** Join parameters and values of object to URL */
export const urlJoin = (obj) => {
    if (!isObject(obj)) {
        return '';
    }

    const arr = [];
    Object.keys(obj).forEach((par) => {
        const val = obj[par];

        if (typeof val === 'undefined') {
            return;
        }

        if (Array.isArray(val)) {
            val.forEach((arrItem) => {
                if (!isObject(arrItem)) {
                    const parName = encodeURIComponent(par);
                    const parValue = encodeURIComponent(arrItem.toString());
                    arr.push(`${parName}[]=${parValue}`);
                }
            });
        } else if (!isObject(val)) {
            const parName = encodeURIComponent(par);
            const parValue = encodeURIComponent(val.toString());
            arr.push(`${parName}=${parValue}`);
        }
    });

    return arr.join('&');
};

export const formatProps = (params) => {
    if (typeof params === 'undefined') {
        return 'undefined';
    }

    if (!isObject(params)) {
        return `${params}`;
    }

    const res = Object.keys(params).map((key) => `${key}: ${params[key]}`);

    return res.join(', ');
};

export const checkPHPerrors = (content) => {
    const errSignatures = [
        '<b>Notice</b>',
        '<b>Warning</b>',
        '<b>Parse error</b>',
        '<b>Fatal error</b>',
        'xdebug-error',
    ];

    if (!content) {
        return;
    }

    const found = errSignatures.some((item) => content.includes(item));
    assert(!found, 'PHP error signature found');
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
