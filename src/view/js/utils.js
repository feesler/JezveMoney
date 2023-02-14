import { isDate, isObject, shiftDate } from 'jezvejs';

export const MS_IN_SECOND = 1000;

export const SORT_BY_CREATEDATE_ASC = 1;
export const SORT_BY_CREATEDATE_DESC = 2;
export const SORT_BY_NAME_ASC = 3;
export const SORT_BY_NAME_DESC = 4;
export const SORT_MANUALLY = 5;

/** Returns array of { name, value } cookie objects */
export const parseCookies = () => {
    const entries = document.cookie.split(';');
    return entries.map((entry) => {
        const nameLength = entry.indexOf('=');
        return {
            name: entry.substring(0, nameLength).trimStart(),
            value: entry.substring(nameLength + 1),
        };
    });
};

/** Set specified cookie */
export const setCookie = (name, value) => {
    const msInYear = 315356e5;
    const date = new Date(Date.now() + msInYear);
    const parts = [
        `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
        'path=/',
        `expires=${date.toUTCString()}`,
        'secure',
    ];

    document.cookie = parts.join('; ');
};

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
        tmpDate = tmpDate.substring(0, pos);
    }

    return fixDate(tmpDate);
};

/** Convert date string to Unix timestamp in seconds */
export const dateStringToTime = (value) => {
    const res = fixDate(value);
    return (res) ? (res / MS_IN_SECOND) : null;
};

/** Convert Unix timestamp in seconds to date string */
export const timeToDate = (value) => {
    const time = parseInt(value, 10);
    if (Number.isNaN(time) || time === 0) {
        throw new Error('Invalid time value');
    }

    return new Date(time * MS_IN_SECOND);
};

/** Returns time for start of the day */
export const cutTime = (value) => {
    const fixedDate = shiftDate(timeToDate(value), 0);
    return fixedDate.getTime() / MS_IN_SECOND;
};

/**
 * Fix string to correct float number format
 * @param {string} str - decimal value string
 */
export const fixFloat = (str) => {
    if (typeof str === 'number') {
        return str;
    }
    if (typeof str !== 'string') {
        return null;
    }

    let res = str.replace(/,/g, '.');
    if (res.indexOf('.') === 0 || !res.length) {
        res = `0${res}`;
    }
    return res;
};

/** Convert string to amount value */
export const amountFix = (value, thSep = ' ') => {
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value !== 'string') {
        return null;
    }

    // Trim leading and trailing spaces
    let res = value.trim();
    // Cut thousands separator
    if (thSep.length > 0) {
        const search = new RegExp(`(\\d)${thSep}(\\d)`, 'g');
        res = res.replaceAll(search, '$1$2');
    }

    return parseFloat(fixFloat(res));
};

export const CENTS_DIGITS = 2;
export const EXCHANGE_DIGITS = 4;

/**
 * Correct calculated value
 * @param {string|Number} val - value to correct
 * @param {Number} prec - precision
 */
export const correct = (val, prec = CENTS_DIGITS) => (
    parseFloat(parseFloat(val).toFixed(prec))
);

/**
 * Correct calculated exchange rate value
 * @param {string|Number} val - exchange rate value
 */
export const correctExch = (val) => correct(val, EXCHANGE_DIGITS);

/**
 * Normalize monetary value from string
 * @param {string|Number} val - value to normalize
 * @param {Number} prec - precision of result decimal
 */
export const normalize = (val, prec = CENTS_DIGITS) => correct(fixFloat(val), prec);

/**
 * Normalize exchange rate value from string
 * @param {string|Number} val - exchange rate value
 */
export const normalizeExch = (val) => normalize(val, EXCHANGE_DIGITS);

/**
 * Check value is valid
 * @param {string|Number} val - value to check
 */
export const isValidValue = (val) => (
    typeof val !== 'undefined' && val !== null && !Number.isNaN(parseFloat(fixFloat(val)))
);

/** Format decimal value */
export const formatValue = (val) => val.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ');

/** Format decimal value with size postfix */
export const formatValueShort = (value) => {
    let val = value;
    let size = '';
    if (value >= 1e12) {
        val = correct(value / 1e12, 2);
        size = 'T';
    } else if (value >= 1e9) {
        val = correct(value / 1e9, 2);
        size = 'B';
    } else if (value >= 1e6) {
        val = correct(value / 1e6, 2);
        size = 'M';
    } else if (value >= 1e3) {
        val = correct(value / 1e3, 2);
        size = 'k';
    }

    const fmtValue = formatValue(val);
    return `${fmtValue}${size}`;
};

/** Formats token string with specified arguments */
export const formatTokenString = (value, ...args) => (
    value.replace(/\$\{(\d+)\}/g, (_, num) => {
        const argNum = parseInt(num, 10);
        if (!argNum) {
            throw new Error(`Invalid argument: ${num}`);
        }
        if (args.length < argNum) {
            throw new Error(`Argument ${num} not defined`);
        }

        return args[argNum - 1];
    })
);

/* eslint-disable no-underscore-dangle */
/** Returns locale string for specified token */
export const __ = (token, ...args) => {
    const { localeTokens } = window;

    if (!isObject(localeTokens)) {
        throw new Error('Locale not loaded');
    }
    if (typeof token !== 'string') {
        throw new Error('Invalid token');
    }
    if (typeof localeTokens[token] !== 'string') {
        throw new Error(`Token ${token} not found`);
    }

    return formatTokenString(localeTokens[token], args);
};
/* eslint-enable no-underscore-dangle */

/** Returns array of formatted debts of person or 'No debts' string */
export const formatPersonDebts = (person) => {
    if (!Array.isArray(person?.accounts)) {
        return null;
    }

    const debtAccounts = person.accounts.filter((account) => account.balance !== 0);
    if (debtAccounts.length === 0) {
        return __('PERSON_NO_DEBTS');
    }

    const { currency } = window.app.model;
    return debtAccounts.map((account) => (
        currency.formatCurrency(account.balance, account.curr_id)
    ));
};

/** Returns selected item object */
export const reduceSelectItem = (item) => (
    (item.selected)
        ? item
        : { ...item, selected: true }
);

/** Returns deselected item object */
export const reduceDeselectItem = (item) => (
    (item.selected)
        ? { ...item, selected: false }
        : item
);

/** Returns reducer for toggle select item by id */
export const reduceToggleItem = (id) => (item) => (
    (item.id === id)
        ? { ...item, selected: !item.selected }
        : item
);

export const getSortByNameIcon = (sortMode) => {
    if (sortMode === SORT_BY_NAME_ASC) {
        return 'sort-asc';
    }
    return (sortMode === SORT_BY_NAME_DESC) ? 'sort-desc' : null;
};

export const getSortByDateIcon = (sortMode) => {
    if (sortMode === SORT_BY_CREATEDATE_ASC) {
        return 'sort-asc';
    }
    return (sortMode === SORT_BY_CREATEDATE_DESC) ? 'sort-desc' : null;
};

export const listData = (list) => (Array.isArray(list) ? list : list?.data);
