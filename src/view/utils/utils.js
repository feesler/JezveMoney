import {
    DAYS_IN_WEEK,
    fixFloat,
    isDate,
    isObject,
    parseDateString,
    shiftDate,
    shiftMonth,
} from 'jezvejs';

export const MAX_DAYS_IN_MONTH = 31;
export const MS_IN_SECOND = 1000;

export const SORT_BY_CREATEDATE_ASC = 1;
export const SORT_BY_CREATEDATE_DESC = 2;
export const SORT_BY_NAME_ASC = 3;
export const SORT_BY_NAME_DESC = 4;
export const SORT_MANUALLY = 5;

/* Decimal values precision */
export const DEFAULT_PRECISION = 2;
export const EXCHANGE_PRECISION = 4;
export const MAX_PRECISION = 8;

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

/** Convert date string to timestamp */
export const parseDate = (str, params = {}) => {
    if (typeof str !== 'string') {
        return null;
    }

    const res = parseDateString(str, {
        ...params,
        locales: params?.locales ?? window.app.dateFormatLocale,
        options: params?.options ?? window.app.dateFormatOptions,
    });

    return isDate(res) ? res : null;
};

/** Convert date string to timestamp */
export const timestampFromString = (str, params = {}) => {
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

    return parseDate(tmpDate, params);
};

/** Returns Unix timestamp in seconds for specified date */
export const getSeconds = (date) => {
    if (!isDate(date)) {
        throw new Error('Invalid date');
    }

    return Math.round(date.getTime() / MS_IN_SECOND);
};

/** Convert date string to Unix timestamp in seconds */
export const dateStringToTime = (value, locales = [], options = {}) => {
    const res = parseDate(value, locales, options);
    return (res) ? getSeconds(res) : null;
};

/** Convert Unix timestamp in seconds to date */
export const timeToDate = (value) => {
    const time = parseInt(value, 10);
    if (Number.isNaN(time) || time === 0) {
        throw new Error('Invalid time value');
    }

    return new Date(time * MS_IN_SECOND);
};

/** Returns time for start of the day */
export const cutDate = (date) => {
    const fixedDate = shiftDate(date, 0);
    return getSeconds(fixedDate);
};

/** Returns time for start of the day */
export const cutTime = (value) => (
    cutDate(timeToDate(value))
);

/** Returns formatted date string */
export const formatDateInputValue = (value) => (
    (value) ? window.app.formatInputDate(value) : null
);

/** Returns formatted date range object */
export const formatDateRange = (range) => ({
    stdate: formatDateInputValue(range?.stdate),
    enddate: formatDateInputValue(range?.enddate),
});

/** Returns date range object for a last week */
export const getWeekRange = () => {
    const now = new Date();
    return {
        stdate: getSeconds(shiftDate(now, -DAYS_IN_WEEK)),
        enddate: cutDate(now),
    };
};

/** Returns date range object for a last month */
export const getMonthRange = () => {
    const now = new Date();
    return {
        stdate: getSeconds(shiftMonth(now, -1)),
        enddate: cutDate(now),
    };
};

/** Returns date range object for half a year */
export const getHalfYearRange = () => {
    const now = new Date();
    return {
        stdate: getSeconds(shiftMonth(now, -6)),
        enddate: cutDate(now),
    };
};

/** Convert string to amount value */
export const amountFix = (value, thSep = ' ') => {
    if (typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value)) {
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

/**
 * Correct calculated value
 * @param {string|Number} val - value to correct
 * @param {Number} prec - precision
 */
export const correct = (val, prec = DEFAULT_PRECISION) => (
    parseFloat(parseFloat(val).toFixed(prec))
);

/**
 * Correct calculated exchange rate value
 * @param {string|Number} val - exchange rate value
 */
export const correctExch = (val) => correct(val, EXCHANGE_PRECISION);

/**
 * Normalize monetary value from string
 * @param {string|Number} val - value to normalize
 * @param {Number} prec - precision of result decimal
 */
export const normalize = (val, prec = DEFAULT_PRECISION) => correct(fixFloat(val), prec);

/**
 * Normalize exchange rate value from string
 * @param {string|Number} val - exchange rate value
 */
export const normalizeExch = (val) => Math.abs(normalize(val, EXCHANGE_PRECISION));

/**
 * Check value is valid
 * @param {string|Number} val - value to check
 */
export const isValidValue = (val) => (
    typeof val !== 'undefined' && val !== null && !Number.isNaN(parseFloat(fixFloat(val)))
);

/** Format decimal value */
export const formatValue = (val) => val.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ');

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

/** Returns true if specified token is exists */
export const hasToken = (token) => (
    (typeof token === 'string')
    && (typeof window.localeTokens[token] === 'string')
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

    const tokenPath = token.split('.');
    const path = [];
    const tokenString = tokenPath.reduce((res, key) => {
        path.push(key);
        if (typeof res[key] === 'undefined') {
            throw new Error(`Token ${path.join('.')} not found`);
        }

        return res[key];
    }, localeTokens);

    return formatTokenString(tokenString, args);
};
/* eslint-enable no-underscore-dangle */

/** Format decimal value with size postfix */
export const formatNumberShort = (value) => {
    let val = value;
    let size = '';
    if (value >= 1e12) {
        val = correct(value / 1e12, 2);
        size = __('NUMBER_SIZE_T');
    } else if (value >= 1e9) {
        val = correct(value / 1e9, 2);
        size = __('NUMBER_SIZE_B');
    } else if (value >= 1e6) {
        val = correct(value / 1e6, 2);
        size = __('NUMBER_SIZE_M');
    } else if (value >= 1e3) {
        val = correct(value / 1e3, 2);
        size = __('NUMBER_SIZE_K');
    }

    const fmtValue = formatValue(val);
    return `${fmtValue}${size}`;
};

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

/** Returns precision of specified currency */
export const getCurrencyPrecision = (id) => {
    const currency = window.app.model.currency.getItem(id);
    if (!currency) {
        throw new Error(__('ERR_CURR_NOT_FOUND'));
    }

    return currency.precision;
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

/** Returns array of selected items */
export const getSelectedItems = (list) => (
    list.filter((item) => item?.selected)
);

/** Returns array of ids of selected items */
export const getSelectedIds = (list) => (
    getSelectedItems(list).map((item) => item.id)
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
