import {
    isObject,
    isFunction,
    isInteger,
    isNumber,
} from '@jezvejs/types';

/* eslint-disable no-console */
/**
 * Verify fields of specified object
 * @param {Object} obj - object to check
 * @param {Object} expected - object with mandatory fields
 * @param {Object} optional - object with optional fields
 */
export const verifyObject = (obj, expected, optional) => {
    if (!isObject(obj) || !isObject(expected)) {
        return false;
    }

    // Check no excess members in the object
    const objectKeys = Object.keys(obj);
    let res = objectKeys.every((key) => {
        if (!(key in expected) && optional && !(key in optional)) {
            console.log(`Unexpected key: ${key}`);
            return false;
        }

        return true;
    });
    if (!res) {
        return false;
    }

    // Check all expected members are present in the object and have correct types
    const expectedKeys = Object.keys(expected);
    res = expectedKeys.every((key) => {
        if (!(key in obj)) {
            console.log(`Not found expected key: ${key}`);
            return false;
        }

        const verifyFunc = expected[key];
        if (!isFunction(verifyFunc) || !verifyFunc(obj[key])) {
            console.log(`Wrong type of value ${key}`);
            return false;
        }

        return true;
    });
    if (!res) {
        return false;
    }

    // Check optional members have correct types if present in the object
    if (!optional) {
        return true;
    }

    const optionalKeys = Object.keys(optional);
    res = optionalKeys.every((key) => {
        if (key in obj) {
            const verifyFunc = optional[key];
            if (!isFunction(verifyFunc) || !verifyFunc(obj[key])) {
                console.log(`Wrong type of value ${key}`);
                return false;
            }
        }

        return true;
    });

    return res;
};
/* eslint-enable no-console */

/** Verify object is create result */
export const isCreateResult = (obj) => verifyObject(obj, { id: isInteger });

/** Verify object is string */
export const isString = (obj) => (typeof obj === 'string');

/** Verity object is null */
export const isNull = (obj) => (obj === null);

/**
 * Returns function to verify object is array and each item of it pass verification
 * @param {Object} data - object to verify
 * @param {Function} verifyFunc - item verification callback
 */
export const isArrayOf = (verifyFunc) => {
    if (!isFunction(verifyFunc)) {
        throw new Error('Invalid verify function');
    }

    return (obj) => Array.isArray(obj) && obj.every(verifyFunc);
};

/** Verify object is array of integers */
export const isIntArray = isArrayOf(isInteger);
/** Verify object is array of numbers */
export const isNumArray = isArrayOf(isNumber);
/** Verify object is array of strings */
export const isStringArray = isArrayOf(isString);

/** Verify object is account */
export const isAccount = (obj) => verifyObject(obj, {
    id: isInteger,
    owner_id: isInteger,
    type: isInteger,
    curr_id: isInteger,
    balance: isNumber,
    initbalance: isNumber,
    limit: isNumber,
    initlimit: isNumber,
    name: isString,
    icon_id: isInteger,
    flags: isInteger,
    pos: isInteger,
    createdate: isInteger,
    updatedate: isInteger,
}, {
    transactionsCount: isInteger,
    user_id: isInteger,
});

/** Verify object is array of accounts */
export const isAccountsArray = isArrayOf(isAccount);

/** Verify object is transaction */
export const isTransaction = (obj) => verifyObject(obj, {
    id: isInteger,
    type: isInteger,
    src_id: isInteger,
    dest_id: isInteger,
    src_amount: isNumber,
    dest_amount: isNumber,
    src_curr: isInteger,
    dest_curr: isInteger,
    src_result: isNumber,
    dest_result: isNumber,
    date: isInteger,
    category_id: isInteger,
    comment: isString,
    pos: isInteger,
}, {
    user_id: isInteger,
    createdate: isInteger,
    updatedate: isInteger,
});

/** Verify object is transactions filter */
export const isTransactionsFilter = (obj) => verifyObject(obj, {}, {
    type: isIntArray,
    accounts: isIntArray,
    persons: isIntArray,
    categories: isIntArray,
    minAmount: isNumber,
    maxAmount: isNumber,
    startDate: isInteger,
    endDate: isInteger,
    search: isString,
});

/** Verify object is array of transactions */
export const isTransactionsArray = isArrayOf(isTransaction);

/** Verify object is list paginator */
export const isPaginator = (obj) => verifyObject(obj, {
    total: isInteger,
    onPage: isInteger,
    pagesCount: isInteger,
    page: isInteger,
});

/** Verify object is transactions list response */
export const isTransactionsList = (obj) => verifyObject(obj, {
    items: isTransactionsArray,
    filter: isTransactionsFilter,
    pagination: isPaginator,
}, {
    order: isString,
});

/** Verify object is statistics histogram data set */
export const isHistogramDataset = (obj) => verifyObject(obj, {
    data: isNumArray,
}, {
    group: isInteger,
    category: isInteger,
});

/** Verify object is array of statistics histogram values */
export const isHistogramValues = isArrayOf(isHistogramDataset);

/** Verify object is statistics histogram series item */
export const isStatisticsSeriesItem = (obj) => (
    Array.isArray(obj)
    && obj.length === 2
    && isString(obj[0])
    && isInteger(obj[1])
);

/** Verify object is array of statistics histogram series */
export const isStatisticsSeries = isArrayOf(isStatisticsSeriesItem);

/** Verify object is statistics histogram */
export const isStatisticsHistogram = (obj) => verifyObject(obj, {
    values: isHistogramValues,
    series: isStatisticsSeries,
});

/** Verify object is statistics filter */
export const isStatisticsFilter = (obj) => verifyObject(obj, {
    report: isString,
}, {
    type: isIntArray,
    categories: isIntArray,
    accounts: isIntArray,
    curr_id: isInteger,
    group: isString,
    startDate: isInteger,
    endDate: isInteger,
});

/** Verify object is statistics response */
export const isStatistics = (obj) => verifyObject(obj, {
    histogram: isStatisticsHistogram,
    filter: isStatisticsFilter,
});

/** Verify object is scheduled transaction */
export const isScheduledTransaction = (obj) => verifyObject(obj, {
    id: isInteger,
    type: isInteger,
    src_id: isInteger,
    dest_id: isInteger,
    src_amount: isNumber,
    dest_amount: isNumber,
    src_curr: isInteger,
    dest_curr: isInteger,
    category_id: isInteger,
    comment: isString,
    start_date: isInteger,
    end_date: (value) => isInteger(value) || isNull(value),
    interval_type: isInteger,
    interval_step: isInteger,
    interval_offset: isIntArray,
}, {
    user_id: isInteger,
    createdate: isInteger,
    updatedate: isInteger,
});

/** Verify object is array of scheduled transactions */
export const isScheduledTransactionsArray = isArrayOf(isScheduledTransaction);

/** Verify object is reminder */
export const isReminder = (obj) => verifyObject(obj, {
    id: isInteger,
    schedule_id: isInteger,
    state: isInteger,
    date: isInteger,
    transaction_id: isInteger,
}, {
    user_id: isInteger,
    createdate: isInteger,
    updatedate: isInteger,
});

/** Verify object is array of reminders */
export const isRemindersArray = isArrayOf(isReminder);

/** Verify object is upcoming reminder */
export const isUpcomingReminder = (obj) => verifyObject(obj, {
    schedule_id: isInteger,
    state: isInteger,
    date: isInteger,
    transaction_id: isInteger,
});

/** Verify object is array of upcoming reminders */
export const isUpcomingRemindersArray = isArrayOf(isUpcomingReminder);

/** Verifies object is upcoming reminders filter */
export const isUpcomingRemindersFilter = (obj) => verifyObject(obj, {}, {
    startDate: isInteger,
    endDate: isInteger,
});

/** Verify object is upcoming reminders list paginator */
export const isUpcomingRemindersPaginator = (obj) => verifyObject(obj, {
    onPage: isInteger,
    page: isInteger,
    range: isInteger,
}, {
    total: isInteger,
    pagesCount: isInteger,
});

/** Verifies object is upcoming reminders list */
export const isUpcomingRemindersList = (obj) => verifyObject(obj, {
    items: isUpcomingRemindersArray,
    filter: isUpcomingRemindersFilter,
    pagination: isUpcomingRemindersPaginator,
});

/** Verify object is import template */
export const isTemplateColumns = (obj) => verifyObject(obj, {
    accountAmount: isInteger,
    accountCurrency: isInteger,
    transactionAmount: isInteger,
    transactionCurrency: isInteger,
    date: isInteger,
    comment: isInteger,
});

/** Verify object is import template */
export const isTemplate = (obj) => verifyObject(obj, {
    id: isInteger,
    name: isString,
    account_id: isInteger,
    type_id: isInteger,
    first_row: isInteger,
    date_locale: isString,
    columns: isTemplateColumns,
}, {
    user_id: isInteger,
    createdate: isInteger,
    updatedate: isInteger,
});

/** Verify object is array of import templates */
export const isTemplatesArray = isArrayOf(isTemplate);

/** Verify object is import condition */
export const isImportCondition = (obj) => verifyObject(obj, {
    id: isInteger,
    rule_id: isInteger,
    field_id: isInteger,
    operator: isInteger,
    value: isString,
    flags: isInteger,
}, {
    user_id: isInteger,
    createdate: isInteger,
    updatedate: isInteger,
});

/** Verify object is array of import conditions */
export const isConditionsArray = isArrayOf(isImportCondition);

/** Verify object is import action */
export const isImportAction = (obj) => verifyObject(obj, {
    id: isInteger,
    rule_id: isInteger,
    action_id: isInteger,
    value: isString,
}, {
    user_id: isInteger,
    createdate: isInteger,
    updatedate: isInteger,
});

/** Verify object is array of import conditions */
export const isActionsArray = isArrayOf(isImportAction);

/** Verify object is import rule */
export const isImportRule = (obj) => verifyObject(obj, {
    id: isInteger,
    flags: isInteger,
}, {
    user_id: isInteger,
    actions: isActionsArray,
    conditions: isConditionsArray,
    createdate: isInteger,
    updatedate: isInteger,
});

/** Verify object is array of import templates */
export const isImportRulesArray = isArrayOf(isImportRule);

/** Verify object is currency */
export const isCurrency = (obj) => verifyObject(obj, {
    id: isInteger,
    name: isString,
    code: isString,
    sign: isString,
    precision: isInteger,
    flags: isInteger,
}, {
    createdate: isInteger,
    updatedate: isInteger,
});

/** Verify object is array of currencies */
export const isCurrenciesArray = isArrayOf(isCurrency);

/** Verify object is user currency */
export const isUserCurrency = (obj) => verifyObject(obj, {
    id: isInteger,
    curr_id: isInteger,
    pos: isInteger,
    flags: isInteger,
}, {
    user_id: isInteger,
    createdate: isInteger,
    updatedate: isInteger,
});

/** Verify object is array of user currencies */
export const isUserCurrenciesArray = isArrayOf(isUserCurrency);

/** Verify object is icon */
export const isIcon = (obj) => verifyObject(obj, {
    id: isInteger,
    name: isString,
    file: isString,
    type: isInteger,
}, {
    createdate: isInteger,
    updatedate: isInteger,
});

/** Verify object is array of icons */
export const isIconsArray = isArrayOf(isIcon);

/** Verify object is account of person */
export const isPersonAccount = (obj) => verifyObject(obj, {
    id: isInteger,
    curr_id: isInteger,
    balance: isNumber,
}, {
    owner_id: isInteger,
    initbalance: isNumber,
    name: isString,
    icon: isInteger,
    flags: isInteger,
    user_id: isInteger,
    createdate: isInteger,
    updatedate: isInteger,
});

/** Verify object is array of accounts of person */
export const isPersonAccountsArray = isArrayOf(isPersonAccount);

/** Verify object is person */
export const isPerson = (obj) => verifyObject(obj, {
    id: isInteger,
    name: isString,
    flags: isInteger,
    pos: isInteger,
    createdate: isInteger,
    updatedate: isInteger,
}, {
    user_id: isInteger,
    accounts: isPersonAccountsArray,
    transactionsCount: isInteger,
});

/** Verify object is array of persons */
export const isPersonsArray = isArrayOf(isPerson);

/** Verify object is category */
export const isCategory = (obj) => verifyObject(obj, {
    id: isInteger,
    name: isString,
    color: isString,
    parent_id: isInteger,
    type: isInteger,
    pos: isInteger,
    createdate: isInteger,
    updatedate: isInteger,
}, {
    user_id: isInteger,
    transactionsCount: isInteger,
});

/** Verify object is array of categories */
export const isCategoriesArray = isArrayOf(isCategory);

/** Verify object is color */
export const isColor = (obj) => verifyObject(obj, {
    id: isInteger,
    value: isString,
    type: isInteger,
    createdate: isInteger,
    updatedate: isInteger,
});

/** Verify object is array of colors */
export const isColorsArray = isArrayOf(isColor);

/** Verify object is user settings */
export const isSettings = (obj) => verifyObject(obj, {
    sort_accounts: isInteger,
    sort_persons: isInteger,
    sort_categories: isInteger,
});

/** Verify object is profile */
export const isProfile = (obj) => verifyObject(obj, {
    login: isString,
    user_id: isInteger,
    owner_id: isInteger,
    name: isString,
    settings: isSettings,
});
