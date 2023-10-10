import {
    isObject,
    isFunction,
    isInt,
    isNum,
} from 'jezvejs';

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
export const isCreateResult = (obj) => verifyObject(obj, { id: isInt });

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
export const isIntArray = isArrayOf(isInt);
/** Verify object is array of numbers */
export const isNumArray = isArrayOf(isNum);
/** Verify object is array of strings */
export const isStringArray = isArrayOf(isString);

/** Verify object is account */
export const isAccount = (obj) => verifyObject(obj, {
    id: isInt,
    owner_id: isInt,
    type: isInt,
    curr_id: isInt,
    balance: isNum,
    initbalance: isNum,
    limit: isNum,
    initlimit: isNum,
    name: isString,
    icon_id: isInt,
    flags: isInt,
    pos: isInt,
    createdate: isInt,
    updatedate: isInt,
}, {
    transactionsCount: isInt,
    user_id: isInt,
});

/** Verify object is array of accounts */
export const isAccountsArray = isArrayOf(isAccount);

/** Verify object is transaction */
export const isTransaction = (obj) => verifyObject(obj, {
    id: isInt,
    type: isInt,
    src_id: isInt,
    dest_id: isInt,
    src_amount: isNum,
    dest_amount: isNum,
    src_curr: isInt,
    dest_curr: isInt,
    src_result: isNum,
    dest_result: isNum,
    date: isInt,
    category_id: isInt,
    comment: isString,
    pos: isInt,
}, {
    user_id: isInt,
    createdate: isInt,
    updatedate: isInt,
});

/** Verify object is transactions filter */
export const isTransactionsFilter = (obj) => verifyObject(obj, {}, {
    type: isIntArray,
    accounts: isIntArray,
    persons: isIntArray,
    categories: isIntArray,
    minAmount: isNum,
    maxAmount: isNum,
    startDate: isInt,
    endDate: isInt,
    search: isString,
});

/** Verify object is array of transactions */
export const isTransactionsArray = isArrayOf(isTransaction);

/** Verify object is list paginator */
export const isPaginator = (obj) => verifyObject(obj, {
    total: isInt,
    onPage: isInt,
    pagesCount: isInt,
    page: isInt,
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
    group: isInt,
    category: isInt,
});

/** Verify object is array of statistics histogram values */
export const isHistogramValues = isArrayOf(isHistogramDataset);

/** Verify object is statistics histogram series item */
export const isStatisticsSeriesItem = (obj) => (
    Array.isArray(obj)
    && obj.length === 2
    && isString(obj[0])
    && isInt(obj[1])
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
    curr_id: isInt,
    group: isString,
    startDate: isInt,
    endDate: isInt,
});

/** Verify object is statistics response */
export const isStatistics = (obj) => verifyObject(obj, {
    histogram: isStatisticsHistogram,
    filter: isStatisticsFilter,
});

/** Verify object is scheduled transaction */
export const isScheduledTransaction = (obj) => verifyObject(obj, {
    id: isInt,
    type: isInt,
    src_id: isInt,
    dest_id: isInt,
    src_amount: isNum,
    dest_amount: isNum,
    src_curr: isInt,
    dest_curr: isInt,
    category_id: isInt,
    comment: isString,
    start_date: isInt,
    end_date: (value) => isInt(value) || isNull(value),
    interval_type: isInt,
    interval_step: isInt,
    interval_offset: isIntArray,
}, {
    user_id: isInt,
    createdate: isInt,
    updatedate: isInt,
});

/** Verify object is array of scheduled transactions */
export const isScheduledTransactionsArray = isArrayOf(isScheduledTransaction);

/** Verify object is reminder */
export const isReminder = (obj) => verifyObject(obj, {
    id: isInt,
    schedule_id: isInt,
    state: isInt,
    date: isInt,
    transaction_id: isInt,
}, {
    user_id: isInt,
    createdate: isInt,
    updatedate: isInt,
});

/** Verify object is array of reminders */
export const isRemindersArray = isArrayOf(isReminder);

/** Verify object is upcoming reminder */
export const isUpcomingReminder = (obj) => verifyObject(obj, {
    schedule_id: isInt,
    state: isInt,
    date: isInt,
    transaction_id: isInt,
});

/** Verify object is array of upcoming reminders */
export const isUpcomingRemindersArray = isArrayOf(isUpcomingReminder);

/** Verifies object is upcoming reminders filter */
export const isUpcomingRemindersFilter = (obj) => verifyObject(obj, {}, {
    startDate: isInt,
    endDate: isInt,
});

/** Verify object is upcoming reminders list paginator */
export const isUpcomingRemindersPaginator = (obj) => verifyObject(obj, {
    onPage: isInt,
    page: isInt,
    range: isInt,
}, {
    total: isInt,
    pagesCount: isInt,
});

/** Verifies object is upcoming reminders list */
export const isUpcomingRemindersList = (obj) => verifyObject(obj, {
    items: isUpcomingRemindersArray,
    filter: isUpcomingRemindersFilter,
    pagination: isUpcomingRemindersPaginator,
});

/** Verify object is import template */
export const isTemplateColumns = (obj) => verifyObject(obj, {
    accountAmount: isInt,
    accountCurrency: isInt,
    transactionAmount: isInt,
    transactionCurrency: isInt,
    date: isInt,
    comment: isInt,
});

/** Verify object is import template */
export const isTemplate = (obj) => verifyObject(obj, {
    id: isInt,
    name: isString,
    account_id: isInt,
    type_id: isInt,
    first_row: isInt,
    date_locale: isString,
    columns: isTemplateColumns,
}, {
    user_id: isInt,
    createdate: isInt,
    updatedate: isInt,
});

/** Verify object is array of import templates */
export const isTemplatesArray = isArrayOf(isTemplate);

/** Verify object is import condition */
export const isImportCondition = (obj) => verifyObject(obj, {
    id: isInt,
    rule_id: isInt,
    field_id: isInt,
    operator: isInt,
    value: isString,
    flags: isInt,
}, {
    user_id: isInt,
    createdate: isInt,
    updatedate: isInt,
});

/** Verify object is array of import conditions */
export const isConditionsArray = isArrayOf(isImportCondition);

/** Verify object is import action */
export const isImportAction = (obj) => verifyObject(obj, {
    id: isInt,
    rule_id: isInt,
    action_id: isInt,
    value: isString,
}, {
    user_id: isInt,
    createdate: isInt,
    updatedate: isInt,
});

/** Verify object is array of import conditions */
export const isActionsArray = isArrayOf(isImportAction);

/** Verify object is import rule */
export const isImportRule = (obj) => verifyObject(obj, {
    id: isInt,
    flags: isInt,
}, {
    user_id: isInt,
    actions: isActionsArray,
    conditions: isConditionsArray,
    createdate: isInt,
    updatedate: isInt,
});

/** Verify object is array of import templates */
export const isImportRulesArray = isArrayOf(isImportRule);

/** Verify object is currency */
export const isCurrency = (obj) => verifyObject(obj, {
    id: isInt,
    name: isString,
    code: isString,
    sign: isString,
    precision: isInt,
    flags: isInt,
}, {
    createdate: isInt,
    updatedate: isInt,
});

/** Verify object is array of currencies */
export const isCurrenciesArray = isArrayOf(isCurrency);

/** Verify object is user currency */
export const isUserCurrency = (obj) => verifyObject(obj, {
    id: isInt,
    curr_id: isInt,
    pos: isInt,
    flags: isInt,
}, {
    user_id: isInt,
    createdate: isInt,
    updatedate: isInt,
});

/** Verify object is array of user currencies */
export const isUserCurrenciesArray = isArrayOf(isUserCurrency);

/** Verify object is icon */
export const isIcon = (obj) => verifyObject(obj, {
    id: isInt,
    name: isString,
    file: isString,
    type: isInt,
}, {
    createdate: isInt,
    updatedate: isInt,
});

/** Verify object is array of icons */
export const isIconsArray = isArrayOf(isIcon);

/** Verify object is account of person */
export const isPersonAccount = (obj) => verifyObject(obj, {
    id: isInt,
    curr_id: isInt,
    balance: isNum,
}, {
    owner_id: isInt,
    initbalance: isNum,
    name: isString,
    icon: isInt,
    flags: isInt,
    user_id: isInt,
    createdate: isInt,
    updatedate: isInt,
});

/** Verify object is array of accounts of person */
export const isPersonAccountsArray = isArrayOf(isPersonAccount);

/** Verify object is person */
export const isPerson = (obj) => verifyObject(obj, {
    id: isInt,
    name: isString,
    flags: isInt,
    pos: isInt,
    createdate: isInt,
    updatedate: isInt,
}, {
    user_id: isInt,
    accounts: isPersonAccountsArray,
    transactionsCount: isInt,
});

/** Verify object is array of persons */
export const isPersonsArray = isArrayOf(isPerson);

/** Verify object is category */
export const isCategory = (obj) => verifyObject(obj, {
    id: isInt,
    name: isString,
    color: isString,
    parent_id: isInt,
    type: isInt,
    pos: isInt,
    createdate: isInt,
    updatedate: isInt,
}, {
    user_id: isInt,
    transactionsCount: isInt,
});

/** Verify object is array of categories */
export const isCategoriesArray = isArrayOf(isCategory);

/** Verify object is color */
export const isColor = (obj) => verifyObject(obj, {
    id: isInt,
    value: isString,
    type: isInt,
    createdate: isInt,
    updatedate: isInt,
});

/** Verify object is array of colors */
export const isColorsArray = isArrayOf(isColor);

/** Verify object is user settings */
export const isSettings = (obj) => verifyObject(obj, {
    sort_accounts: isInt,
    sort_persons: isInt,
    sort_categories: isInt,
});

/** Verify object is profile */
export const isProfile = (obj) => verifyObject(obj, {
    login: isString,
    user_id: isInt,
    owner_id: isInt,
    name: isString,
    settings: isSettings,
});
