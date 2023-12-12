import { asArray, isDate } from '@jezvejs/types';
import { getLongMonthName } from '@jezvejs/datetime';

import { App } from '../Application/App.js';
import { normalize } from './decimal.js';
import { __, timeToDate } from './utils.js';

import { Transaction } from '../Models/Transaction.js';

/**
 * Returns formatted currency value
 *
 * @param {number|string} value
 * @param {object} state
 * @returns {string}
 */
export const formatValue = (value, state) => (
    App.model.currency.formatCurrency(
        value,
        state.chartCurrency,
    )
);

/**
 * Returns normalized percents string
 *
 * @param {number|string} value
 * @returns {string}
 */
export const formatPercent = (value) => (
    `${normalize(value, 2)} %`
);

/**
 * Returns formatted date string for specified state
 *
 * @param {string|number} value
 * @param {object} state
 * @returns {string}
 */
export const formatDateLabel = (value, state) => {
    const { group } = (state.form ?? state.filter);

    if (group === 'day' || group === 'week') {
        return App.formatDate(value);
    }

    if (group === 'month') {
        return App.formatDate(value, {
            locales: App.dateFormatLocale,
            options: { year: '2-digit', month: 'short' },
        });
    }

    if (group === 'year') {
        return App.formatDate(value, {
            locales: App.dateFormatLocale,
            options: { year: 'numeric' },
        });
    }

    return null;
};

/**
 * Returns long formatted date string for specified state
 *
 * @param {string|number} value
 * @param {object} state
 * @returns {string}
 */
export const formatLongDateLabel = (value, state) => {
    const date = (isDate(value)) ? value : timeToDate(value);
    if (!isDate(date)) {
        throw new Error('Invalid date object');
    }

    const { group } = (state.form ?? state.filter);

    if (group === 'day' || group === 'week') {
        return App.formatDate(date);
    }

    if (group === 'month') {
        const rYear = date.getFullYear();
        const monthLong = getLongMonthName(date, App.dateFormatLocale);
        return `${monthLong} ${rYear}`;
    }

    if (group === 'year') {
        return App.formatDate(date, {
            locales: App.dateFormatLocale,
            options: { year: 'numeric' },
        });
    }

    return null;
};

/**
 * Returns true if current statistics data is stacked
 *
 * @param {object} filter
 * @returns {boolean}
 */
export const isStackedData = (filter) => (
    filter?.report === 'category'
    || (filter?.report === 'account' && filter.accounts?.length > 1)
);

/**
 * Returns name string for specified data category
 *
 * @param {number|string} value data category id
 * @param {object} state state object
 * @returns {string}
 */
export const getDataCategoryName = (value, state) => {
    const categoryId = parseInt(value, 10);

    const isStacked = isStackedData(state.filter);
    if (!isStacked) {
        const selectedTypes = asArray(state.filter.type);
        return Transaction.getTypeTitle(selectedTypes[categoryId]);
    }

    if (state.filter.report === 'account') {
        const account = App.model.userAccounts.getItem(categoryId);
        return account.name;
    }

    if (state.filter.report === 'category') {
        if (categoryId === 0) {
            return __('categories.noCategory');
        }

        const category = App.model.categories.getItem(categoryId);
        return category.name;
    }

    throw new Error('Invalid state');
};
