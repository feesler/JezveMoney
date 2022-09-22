import {
    isDate,
    isNum,
    isObject,
    assert,
} from 'jezve-test';

/** Check object is empty */
export const isEmpty = (obj) => {
    if (typeof obj === 'object') {
        return Object.keys(obj).length === 0;
    }

    return true;
};

export const asyncMap = async (data, func) => {
    assert.isArray(data, 'Invalid data type');
    assert.isFunction(func, 'Invalid function type');

    const tasks = data.map(func);
    return Promise.all(tasks);
};

/** Convert date string from DD.MM.YYYY to timestamp */
export const convDate = (dateStr) => {
    if (typeof dateStr !== 'string') {
        return null;
    }

    const res = Date.parse(dateStr.split('.').reverse().join('-'));
    if (Number.isNaN(res)) {
        return null;
    }

    return res;
};

/** Return timestamp for the start of the day */
export const cutDate = (date) => {
    if (!isDate(date)) {
        return null;
    }

    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
};

// Convert Date object, timestamp or DD.MM.YYYY string to the timestamp of the start of day
export const fixDate = (date) => {
    if (isDate(date)) {
        return cutDate(date);
    }

    if (typeof date === 'number') {
        return cutDate(new Date(date));
    }

    return convDate(date);
};

/** Check string is correct date in dd.mm.yyyy format */
export const checkDate = (str) => {
    if (typeof str !== 'string' || !str.length) {
        return false;
    }

    const sparr = str.split('.');
    if (sparr.length !== 3) {
        return false;
    }

    if (!isNum(sparr[0]) || !isNum(sparr[1]) || !isNum(sparr[2])) {
        return false;
    }

    if (
        sparr[0] < 1
        || sparr[0] > 31
        || sparr[1] < 1
        || sparr[1] > 12
        || sparr[2] < 1970
    ) {
        return false;
    }

    return true;
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

/** Format specified value */
export const formatValue = (val) => val.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ');

/*
* Normalized decimal calculations
*/

/** Fix string to correct float number format */
export const fixFloat = (str) => {
    if (typeof str === 'number') {
        return str.toString();
    }

    if (typeof str !== 'string') {
        return null;
    }

    let res = str.replace(/,/g, '.');
    if (res.startsWith('.') || !res.length) {
        res = `0${res}`;
    }
    return res;
};

/** Correct calculated value */
export const correct = (val, prec = 2) => parseFloat(parseFloat(val).toFixed(prec));

/** Correct calculated exchange rate value */
export const correctExch = (val) => correct(val, 5);

/** Normalize monetary value from string */
export const normalize = (val, prec = 2) => parseFloat(parseFloat(fixFloat(val)).toFixed(prec));

/** Normalize exchange rate value from string */
export const normalizeExch = (val) => normalize(val, 5);

/** Check value is valid */
export const isValidValue = (val) => (typeof val !== 'undefined' && val !== null && !Number.isNaN(parseFloat(fixFloat(val))));

/** Return number of digits after the decimal point */
export const digitsAfterPoint = (val) => {
    const fixed = fixFloat(val);
    const float = parseFloat(fixed);
    const intPart = Math.trunc(float).toString();
    return fixed.length - intPart.length - 1;
};

/** Trim string value of decimal to specified number of digits after decimal point */
export const trimToDigitsLimit = (val, limit) => {
    const digits = digitsAfterPoint(val);
    if (digits <= limit) {
        return val;
    }

    return val.substring(0, val.length - (digits - limit));
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
