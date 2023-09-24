import {
    DAYS_IN_WEEK,
    isDate,
    isObject,
    parseDateString,
    shiftDate,
    shiftMonth,
} from 'jezvejs';

import { correct, formatValue } from './decimal.js';
import { App } from '../Application/App.js';

export const MAX_DAYS_IN_MONTH = 31;
export const MS_IN_SECOND = 1000;

export const SORT_BY_CREATEDATE_ASC = 1;
export const SORT_BY_CREATEDATE_DESC = 2;
export const SORT_BY_NAME_ASC = 3;
export const SORT_BY_NAME_DESC = 4;
export const SORT_MANUALLY = 5;

export const DEFAULT_PAGE_LIMIT = 10;

/** Returns URL instance for specified path and search params */
export const getApplicationURL = (path = '', params = {}) => {
    const res = new URL(`${App.baseURL}${path}`);

    Object.entries(params ?? {}).forEach(([prop, value]) => {
        if (Array.isArray(value)) {
            const arrProp = `${prop}[]`;
            value.forEach((item) => res.searchParams.append(arrProp, item));
        } else {
            res.searchParams.set(prop, value);
        }
    });

    return res;
};

/** Returns export transactions URL */
export const getExportURL = (options) => (
    getApplicationURL('transactions/export/', options)
);

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
        locales: params?.locales ?? App.dateFormatLocale,
        options: params?.options ?? App.dateFormatOptions,
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
    const timestamp = isDate(date) ? date.getTime() : parseInt(date, 10);
    if (!timestamp) {
        throw new Error('Invalid value');
    }

    return Math.round(timestamp / MS_IN_SECOND);
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
    (value) ? App.formatInputDate(value) : null
);

/** Returns formatted date range object */
export const formatDateRange = (range) => ({
    startDate: formatDateInputValue(range?.startDate),
    endDate: formatDateInputValue(range?.endDate),
});

/** Returns date range object for a last week */
export const getWeekRange = () => {
    const now = new Date();
    return {
        startDate: getSeconds(shiftDate(now, -DAYS_IN_WEEK)),
        endDate: cutDate(now),
    };
};

/** Returns date range object for a last month */
export const getMonthRange = () => {
    const now = new Date();
    return {
        startDate: getSeconds(shiftMonth(now, -1)),
        endDate: cutDate(now),
    };
};

/** Returns date range object for half a year */
export const getHalfYearRange = () => {
    const now = new Date();
    return {
        startDate: getSeconds(shiftMonth(now, -6)),
        endDate: cutDate(now),
    };
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

/** Returns not formatted token string for specified path */
const getTokenString = (token) => {
    const { localeTokens } = window;

    if (!isObject(localeTokens)) {
        throw new Error('Locale not loaded');
    }
    if (typeof token !== 'string') {
        throw new Error('Invalid token');
    }

    const tokenPath = token.split('.');
    const path = [];

    return tokenPath.reduce((res, key) => {
        path.push(key);
        if (typeof res[key] === 'undefined') {
            throw new Error(`Token ${path.join('.')} not found`);
        }

        return res[key];
    }, localeTokens);
};

/** Returns true if specified token is exists */
export const hasToken = (token) => (
    typeof getTokenString(token) === 'string'
);

/* eslint-disable no-underscore-dangle */
/** Returns locale string for specified token */
export const __ = (token, ...args) => {
    const tokenString = getTokenString(token);
    if (typeof tokenString !== 'string') {
        throw new Error('Invalid token string');
    }

    return formatTokenString(tokenString, ...args);
};
/* eslint-enable no-underscore-dangle */

/** Format decimal value with size postfix */
export const formatNumberShort = (value) => {
    let val = value;
    let size = '';
    if (value >= 1e12) {
        val = correct(value / 1e12, 2);
        size = __('numberSizes.T');
    } else if (value >= 1e9) {
        val = correct(value / 1e9, 2);
        size = __('numberSizes.B');
    } else if (value >= 1e6) {
        val = correct(value / 1e6, 2);
        size = __('numberSizes.M');
    } else if (value >= 1e3) {
        val = correct(value / 1e3, 2);
        size = __('numberSizes.K');
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
        return __('persons.noDebts');
    }

    const { currency } = App.model;
    return debtAccounts.map((account) => (
        currency.formatCurrency(account.balance, account.curr_id)
    ));
};

/** Returns precision of specified currency */
export const getCurrencyPrecision = (id) => {
    const currency = App.model.currency.getItem(id);
    if (!currency) {
        throw new Error(__('currencies.errors.notFound'));
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
