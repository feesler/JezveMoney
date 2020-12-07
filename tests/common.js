/** Check object is date */
export function isDate(obj) {
    return (obj instanceof Date && !Number.isNaN(obj.valueOf()));
}

/** Check object is function */
export function isFunction(obj) {
    const getType = {};
    return obj
        && (getType.toString.call(obj) === '[object Function]'
            || typeof obj === 'function');
}

/** Check object is {} */
export function isObject(o) {
    return o !== null
        && typeof o === 'object'
        && Object.prototype.toString.call(o) === '[object Object]';
}

export async function asyncMap(data, func) {
    if (!Array.isArray(data)) {
        throw new Error('Invalid data type');
    }
    if (!isFunction(func)) {
        throw new Error('Invalid function type');
    }

    const tasks = data.map(func);
    return Promise.all(tasks);
}

/* eslint-disable no-param-reassign */
/** Set parameters of object */
export function setParam(obj, params) {
    if (!obj || !params || typeof params !== 'object') {
        return;
    }

    Object.keys(params).forEach((key) => {
        const val = params[key];
        if (Array.isArray(val)) {
            obj[key] = val.map((item) => item);
        } else if (isObject(val)) {
            if (obj[key] === null || typeof obj[key] === 'undefined') {
                obj[key] = {};
            }

            setParam(obj[key], val);
        } else {
            try {
                obj[key] = val;
            } catch (e) {
                if (obj.setAttribute) {
                    obj.setAttribute(key, val);
                }
            }
        }
    });
}
/* eslint-enable no-param-reassign */

/** Convert date string from DD.MM.YYYY to timestamp */
export function convDate(dateStr) {
    if (typeof dateStr !== 'string') {
        return null;
    }

    const res = Date.parse(dateStr.split('.').reverse().join('-'));
    if (Number.isNaN(res)) {
        return null;
    }

    return res;
}

function leadZero(val) {
    const v = parseInt(val, 10);
    if (Number.isNaN(v)) {
        throw new Error('Invalid time values speicifed');
    }

    if (v < 10) {
        return `0${v}`;
    }

    return v.toString();
}

/** Format date as DD.MM.YYYY */
export function formatDate(date) {
    if (!isDate(date)) {
        throw new Error('Invalid type of parameter');
    }

    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const day = date.getDate();
    return `${leadZero(day)}.${leadZero(month)}.${leadZero(year)}`;
}

/** Return timestamp for the start of the day */
export function cutDate(date) {
    if (!isDate(date)) {
        return null;
    }

    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

// Convert Date object, timestamp or DD.MM.YYYY string to the timestamp of the start of day
export function fixDate(date) {
    if (isDate(date)) {
        return cutDate(date);
    }

    if (typeof date === 'number') {
        return cutDate(new Date(date));
    }

    return convDate(date);
}

const SECOND = 1000;
const MINUTE = 60000;
const HOUR = 3600000;

/** Format time in milliseconds to HH:MM:SS format */
export function formatTime(time) {
    const t = parseInt(time, 10);
    if (Number.isNaN(t)) {
        throw new Error('Invalid time values speicifed');
    }

    const hours = Math.floor(t / HOUR);
    const minutes = Math.floor((t % HOUR) / MINUTE);
    const seconds = Math.floor((t % MINUTE) / SECOND);

    return `${leadZero(hours)}:${leadZero(minutes)}:${leadZero(seconds)}`;
}

/** Format specified value */
export function formatValue(val) {
    return val.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ');
}

/*
* Normalized decimal calculations
*/

/** Fix string to correct float number format */
export function fixFloat(str) {
    if (typeof str === 'string') {
        let res = str.replace(/,/g, '.');
        if (res.startsWith('.') || !res.length) {
            res = `0${res}`;
        }
        return res;
    }

    if (typeof str === 'number') {
        return str;
    }

    return null;
}

/** Correct calculated value */
export function correct(val, prec = 2) {
    return parseFloat(parseFloat(val).toFixed(prec));
}

/** Correct calculated exchange rate value */
export function correctExch(val) {
    return correct(val, 5);
}

/** Normalize monetary value from string */
export function normalize(val, prec = 2) {
    return parseFloat(parseFloat(fixFloat(val)).toFixed(prec));
}

/** Normalize exchange rate value from string */
export function normalizeExch(val) {
    return normalize(val, 5);
}

/** Check value is valid */
export function isValidValue(val) {
    return (typeof val !== 'undefined' && val !== null && !Number.isNaN(parseFloat(fixFloat(val))));
}

/*
* Other
*/

/** Quote string for CSV */
function quoteString(str) {
    const escaped = str.toString().split('"').join('\\"');

    return `"${escaped}"`;
}

/** Return CSV */
export function createCSV({
    header = null,
    data = [],
    delimiter = ';',
    newLine = '\r\n',
}) {
    let rows = [];

    if (typeof delimiter !== 'string'
        || typeof newLine !== 'string'
        || !Array.isArray(data)) {
        throw new Error('Invalid parameters');
    }

    if (Array.isArray(header)) {
        rows.push(header);
    }

    rows = rows.concat(data);

    const res = rows.map(
        (row) => row.map(quoteString).join(delimiter),
    ).join(newLine).trim();

    return `${res}${newLine}`;
}

/** Return deep copy of object */
export function copyObject(item) {
    if (Array.isArray(item)) {
        return item.map(copyObject);
    }

    if (isObject(item)) {
        const res = {};
        Object.getOwnPropertyNames(item).forEach((key) => {
            res[key] = copyObject(item[key]);
        });

        return res;
    }

    return item;
}

/** Join parameters and values of object to URL */
export function urlJoin(obj) {
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
}

export function formatProps(params) {
    const res = Object.keys(params).map((key) => `${key}: ${params[key]}`);

    return res.join(', ');
}

export function checkPHPerrors(content) {
    const errSignatures = [
        '<b>Notice</b>',
        '<b>Parse error</b>',
        '<b>Fatal error</b>',
        'xdebug-error',
    ];

    if (!content) {
        return;
    }

    const found = errSignatures.some((item) => content.includes(item));
    if (found) {
        throw new Error('PHP error signature found');
    }
}

export function checkObjValue(obj, expectedObj, ret = false) {
    let res = true;

    // undefined means no care
    if (typeof expectedObj === 'undefined') {
        return true;
    }

    if (!isObject(expectedObj) && !Array.isArray(expectedObj)) {
        if (obj === expectedObj) {
            return true;
        }

        if (ret) {
            return {
                key: '',
                value: obj,
                expected: expectedObj,
            };
        }

        throw new Error(`Not expected value "${obj}", "${expectedObj}" is expected`);
    }

    if (obj === expectedObj) {
        return true;
    }

    let value;
    let expected;
    const expectedKeys = Object.getOwnPropertyNames(expectedObj);
    for (const vKey of expectedKeys) {
        if (obj === null || !(vKey in obj)) {
            res = { key: vKey };
            break;
        }

        expected = expectedObj[vKey];
        value = obj[vKey];
        if (isObject(expected) || Array.isArray(expected)) {
            res = checkObjValue(value, expected, true);
            if (res !== true) {
                res.key = `${vKey}.${res.key}`;
                break;
            }
        } else if (value !== expected) {
            res = {
                key: vKey,
                value,
                expected,
            };
            break;
        }
    }

    if (res !== true && !ret) {
        if ('expected' in res) {
            throw new Error(`Not expected value "${res.value}" for (${res.key}) "${res.expected}" is expected`);
        } else {
            throw new Error(`Path (${res.key}) not found`);
        }
    }

    return res;
}

let testEnv = null;

export function setupTest(env) {
    if (!env) {
        throw new Error('Invalid environment specified');
    }

    testEnv = env;
}

/**
 * Run action and add result to the list
 * @param {string} descr - description of test
 * @param {Function} action - action function
 */
export async function test(descr, action) {
    try {
        const res = await action();

        testEnv.addResult(descr, res);
    } catch (e) {
        const extError = (e instanceof Error) ? e : new Error(e);
        extError.descr = descr;
        throw extError;
    }
}
