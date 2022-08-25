import { isDate } from 'jezvejs';

/* Convert number to string and prepend zero if value is less than 10 */
export const leadZero = (val) => {
    const v = parseInt(val, 10);
    if (Number.isNaN(v)) {
        throw new Error('Invalid value');
    }

    if (v < 10) {
        return `0${v}`;
    }

    return v.toString();
};

/** Convert DD.MM.YYYY string to timestamp */
export const fixDate = (str) => {
    if (typeof str !== 'string') {
        return null;
    }

    const res = Date.parse(str.split('.').reverse().join('-'));
    if (Number.isNaN(res)) {
        return null;
    }

    return res;
};

/** Convert date string to timestamp */
export const timestampFromString = (str) => {
    if (typeof str === 'number') {
        return str;
    }
    if (isDate(str)) {
        return str.getTime();
    }
    if (typeof str !== 'string') {
        throw new Error('Invalid type of parameter');
    }

    let tmpDate = str;
    const pos = str.indexOf(' ');
    if (pos !== -1) {
        tmpDate = tmpDate.substr(0, pos);
    }

    return fixDate(tmpDate);
};

/**
 * Fix string to correct float number format
 * @param {string} str - decimal value string
 */
export const fixFloat = (str) => {
    if (typeof str === 'number') {
        return str;
    }

    if (typeof str === 'string') {
        let res = str.replace(/,/g, '.');
        if (res.indexOf('.') === 0 || !res.length) {
            res = `0${res}`;
        }
        return res;
    }

    return null;
};

/** Convert string to amount value */
export const amountFix = (value) => {
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value !== 'string') {
        return null;
    }

    const res = value.replace(/ /, '');
    return parseFloat(fixFloat(res));
};

/**
 * Correct calculated value
 * @param {string|Number} val - value to correct
 * @param {Number} prec - precision
 */
export const correct = (val, prec = 2) => (
    parseFloat(parseFloat(val).toFixed(prec))
);

/**
 * Correct calculated exchange rate value
 * @param {string|Number} val - exchange rate value
 */
export const correctExch = (val) => correct(val, 5);

/**
 * Normalize monetary value from string
 * @param {string|Number} val - value to normalize
 * @param {Number} prec - precision of result decimal
 */
export const normalize = (val, prec = 2) => (
    parseFloat(parseFloat(fixFloat(val)).toFixed(prec))
);

/**
 * Normalize exchange rate value from string
 * @param {string|Number} val - exchange rate value
 */
export const normalizeExch = (val) => normalize(val, 5);

/**
 * Check value is valid
 * @param {string|Number} val - value to check
 */
export const isValidValue = (val) => (
    typeof val !== 'undefined' && val !== null && !Number.isNaN(parseFloat(fixFloat(val)))
);
