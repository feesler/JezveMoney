import {
    isObject,
    isInt,
    assert,
    asArray,
} from 'jezve-test';
import {
    isValidValue,
    availSortTypes,
    normalize,
    dateStringToSeconds,
    timeToSeconds,
} from '../common.js';
import {
    EXPENSE,
    INCOME,
    DEBT,
    TRANSFER,
    LIMIT_CHANGE,
    Transaction,
} from './Transaction.js';
import { App } from '../Application.js';
import { ImportRule } from './ImportRule.js';
import {
    ACCOUNT_HIDDEN,
    ACCOUNT_TYPE_CREDIT_CARD,
    AccountsList,
    accountTypes,
} from './AccountsList.js';
import { PERSON_HIDDEN, PersonsList } from './PersonsList.js';
import { TransactionsList } from './TransactionsList.js';
import { ImportRuleList } from './ImportRuleList.js';
import { ImportTemplateList } from './ImportTemplateList.js';
import { api } from './api.js';
import { CategoryList } from './CategoryList.js';
import { UserCurrencyList } from './UserCurrencyList.js';
import { ImportCondition } from './ImportCondition.js';
import { ScheduledTransactionsList } from './ScheduledTransactionsList.js';
import { ScheduledTransaction } from './ScheduledTransaction.js';
import { RemindersList } from './RemindersList.js';
import {
    REMINDER_CANCELLED,
    REMINDER_CONFIRMED,
    REMINDER_SCHEDULED,
    Reminder,
} from './Reminder.js';
import { Account } from './Account.js';
import { Person } from './Person.js';
import { Category } from './Category.js';
import { UserCurrency } from './UserCurrency.js';
import { ImportTemplate } from './ImportTemplate.js';

/** Settings */
const sortSettings = ['sort_accounts', 'sort_persons', 'sort_categories'];
const availSettings = [
    ...sortSettings,
    'date_locale',
    'decimal_locale',
    'tr_group_by_date',
    'tz_offset',
];

/** Categories */
const ANY_TYPE = 0;
const transTypes = [...Transaction.availTypes, ANY_TYPE];

/**
 * Check all properties of expected object are presents in specified object
 * @param {Object} fields - object to check
 * @param {Object} expFields - expected object
 */
function checkFields(fields, expFields) {
    if (!fields || !expFields) {
        return false;
    }

    return expFields.every((f) => (f in fields));
}

/**
 * Return new object with properties of specified object which are presents in expected object
 * @param {Object} fields - object to check
 * @param {Object} expFields - expected object
 */
function copyFields(fields, expFields) {
    assert(fields && expFields, 'Invalid parameters');

    const res = {};
    expFields.forEach((f) => {
        if (f in fields) {
            res[f] = structuredClone(fields[f]);
        }
    });

    return res;
}

export class AppState {
    static dataRequestMap = {
        currency: 'getCurrencies',
        icons: 'getIcons',
        accounts: 'getAccounts',
        persons: 'getPersons',
        transactions: 'getTransactions',
        schedule: 'getScheduledTransactions',
        reminders: 'getReminders',
        statistics: 'getStatistics',
        categories: 'getCategories',
        importtemplates: 'getImportTemplates',
        importrules: 'getImportRules',
        userCurrencies: 'getUserCurrencies',
        profile: 'getProfile',
    };

    constructor() {
        this.accounts = null;
        this.userAccountsCache = null;
        this.sortedAccountsCache = null;
        this.persons = null;
        this.personsCache = null;
        this.sortedPersonsCache = null;
        this.transactions = null;
        this.schedule = null;
        this.reminders = null;
        this.templates = null;
        this.rules = null;
        this.userCurrencies = null;
        this.profile = null;
    }

    async fetch() {
        const newState = await api.state.read();
        this.setState(newState);
    }

    setState(state) {
        this.profile = structuredClone(state.profile);

        if (!this.accounts) {
            this.accounts = AccountsList.create();
        }
        this.accounts.setData(state.accounts.data);
        this.accounts.autoincrement = state.accounts.autoincrement;
        this.resetUserAccountsCache();
        this.sortAccounts();

        if (!this.persons) {
            this.persons = PersonsList.create();
        }
        this.persons.setData(state.persons.data);
        this.persons.autoincrement = state.persons.autoincrement;
        this.resetPersonsCache();
        this.sortPersons();

        if (!this.transactions) {
            this.transactions = TransactionsList.create();
        }
        const transactions = state.transactions?.items ?? state.transactions.data;
        this.transactions.setData(transactions);
        this.transactions.autoincrement = state.transactions.autoincrement;

        if (!this.schedule) {
            this.schedule = ScheduledTransactionsList.create();
        }
        this.schedule.setData(state.schedule.data);
        this.schedule.autoincrement = state.schedule.autoincrement;

        if (!this.reminders) {
            this.reminders = RemindersList.create();
        }
        this.reminders.setData(state.reminders.data);
        this.reminders.autoincrement = state.reminders.autoincrement;

        if (!this.categories) {
            this.categories = CategoryList.create();
        }
        this.categories.setData(state.categories.data);
        this.categories.autoincrement = state.categories.autoincrement;
        this.sortCategories();

        if (!this.templates) {
            this.templates = ImportTemplateList.create();
        }
        const templates = state.importtemplates ?? state.templates;
        this.templates.setData(templates.data);
        this.templates.autoincrement = templates.autoincrement;

        if (!this.rules) {
            this.rules = ImportRuleList.create();
        }
        const rules = state.importrules ?? state.rules;
        this.rules.setData(rules.data);
        this.rules.autoincrement = rules.autoincrement;

        if (!this.userCurrencies) {
            this.userCurrencies = UserCurrencyList.create();
        }
        this.userCurrencies.setData(state.userCurrencies.data);
        this.userCurrencies.autoincrement = state.userCurrencies.autoincrement;
    }

    async fetchAndTest() {
        const newState = new AppState();
        await newState.fetch();

        const res = newState.meetExpectation(this);
        if (res) {
            this.setState(newState);
        }

        return res;
    }

    clone() {
        const res = new AppState();

        res.accounts = this.accounts.clone();
        res.persons = this.persons.clone();
        res.categories = this.categories.clone();
        res.transactions = this.transactions.clone();
        res.schedule = this.schedule.clone();
        res.reminders = this.reminders.clone();
        res.templates = this.templates.clone();
        res.rules = this.rules.clone();
        res.userCurrencies = this.userCurrencies.clone();
        res.profile = structuredClone(this.profile);

        return res;
    }

    getNoDatesList(data) {
        return data.map((item) => {
            const res = { ...item };
            delete res.createdate;
            delete res.updatedate;
            return res;
        });
    }

    /* eslint-disable no-console */
    compareLists(local, expected) {
        const noDatesData = this.getNoDatesList(expected.data);

        try {
            assert(local.data.length === expected.data.length);

            assert.deepMeet(local.data, noDatesData);
        } catch (e) {
            console.log('Real data: ', local.data);
            console.log('Expected: ', noDatesData);

            throw e;
        }
    }
    /* eslint-enable no-console */

    meetExpectation(expected) {
        this.compareLists(this.accounts, expected.accounts);
        this.compareLists(this.transactions, expected.transactions);
        this.compareLists(this.schedule, expected.schedule);
        this.compareLists(this.reminders, expected.reminders);
        this.compareLists(this.persons, expected.persons);
        this.compareLists(this.categories, expected.categories);
        this.compareLists(this.templates, expected.templates);
        this.compareLists(this.userCurrencies, expected.userCurrencies);

        assert(this.rules.length === expected.rules.length);
        this.rules.forEach((rule, index) => {
            const expectedRule = expected.rules.data[index];

            this.compareLists(rule.conditions, expectedRule.conditions);
            this.compareLists(rule.actions, expectedRule.actions);
        });

        assert.deepMeet(this.profile, expected.profile);

        return true;
    }

    createMultiple(method, params) {
        assert.isFunction(this[method], 'Invalid method');

        if (!Array.isArray(params?.data)) {
            return false;
        }

        const ids = [];
        const origState = this.clone();

        for (const item of params.data) {
            const resExpected = this[method](item);
            if (!resExpected) {
                this.setState(origState);
                return false;
            }

            ids.push(resExpected.id);
        }

        return this.returnState(params.returnState, { ids });
    }

    /**
     * Profile
     */
    setUserProfile(profile) {
        this.profile = structuredClone(profile);
        if (this.profile.password) {
            delete this.profile.password;
        }
    }

    resetData(options = {}) {
        const resetPersons = 'persons' in options;
        const keepAccountBalance = 'keepbalance' in options;

        if ('accounts' in options) {
            const accountsToDelete = (resetPersons)
                ? this.accounts
                : this.accounts.getUserAccounts();

            const id = accountsToDelete.getIds();
            this.deleteAccounts({ id });
        }

        if (resetPersons) {
            const id = this.persons?.getIds();
            this.deletePersons({ id });
        }

        if ('categories' in options) {
            const id = this.categories?.getIds();
            this.deleteCategories({ id });
        }

        if ('transactions' in options) {
            this.transactions?.reset();

            const accountsData = (keepAccountBalance)
                ? this.accounts?.toCurrent(true)
                : this.accounts?.toInitial(true);
            this.accounts?.setData(accountsData);
        }

        if ('schedule' in options) {
            this.schedule?.reset();
            this.reminders?.reset();
        }

        if ('importtpl' in options) {
            this.templates?.reset();
        }

        if ('importrules' in options) {
            this.rules?.reset();
        }
    }

    resetAll() {
        this.accounts?.reset();
        this.resetUserAccountsCache();
        this.persons?.reset();
        this.categories?.reset();
        this.resetPersonsCache();
        this.transactions?.reset();
        this.schedule?.reset();
        this.reminders?.reset();
        this.templates?.reset();
        this.rules?.reset();
        this.userCurrencies?.reset();
    }

    changeName(name) {
        if (name.length === 0 || name === this.profile.name) {
            return false;
        }

        this.profile.name = name;

        return {};
    }

    deleteProfile() {
        this.resetAll();
        delete this.profile;
    }

    getAccountsSortMode() {
        return this.profile.settings.sort_accounts;
    }

    getPersonsSortMode() {
        return this.profile.settings.sort_persons;
    }

    getCategoriesSortMode() {
        return this.profile.settings.sort_categories;
    }

    getDateFormatLocale() {
        return this.profile.settings.date_locale;
    }

    getDecimalFormatLocale() {
        return this.profile.settings.decimal_locale;
    }

    getGroupByDate() {
        return this.profile.settings.tr_group_by_date === 1;
    }

    getTimezoneOffset() {
        return this.profile.settings.tz_offset;
    }

    getCurrencies() {
        const res = {
            data: this.getNoDatesList(App.currency.data),
        };

        return res;
    }

    getIcons() {
        const res = {
            data: this.getNoDatesList(App.icons.data),
        };

        return res;
    }

    getAccounts(options = {}) {
        let {
            visibility = 'visible',
        } = options;

        visibility = visibility?.toLowerCase();

        const res = {};

        if (visibility === 'visible') {
            res.data = this.accounts.getUserVisible(true);
        } else if (visibility === 'hidden') {
            res.data = this.accounts.getUserHidden(true);
        } else if (visibility === 'all') {
            res.data = this.accounts.getUserAccounts(true);
        } else {
            throw new Error(`Invalid visibility value: ${options.visibility}`);
        }

        res.data = this.getNoDatesList(res.data);

        return res;
    }

    getPersons(options = {}) {
        let {
            visibility = 'visible',
        } = options;

        visibility = visibility?.toLowerCase();

        const res = {};

        if (visibility === 'visible') {
            res.data = this.persons.getVisible(true);
        } else if (visibility === 'hidden') {
            res.data = this.persons.getHidden(true);
        } else if (visibility === 'all') {
            res.data = this.persons.data;
        } else {
            throw new Error(`Invalid visibility value: ${options.visibility}`);
        }

        res.data = this.getNoDatesList(res.data);

        return res;
    }

    getCategories(options = {}) {
        const res = {};

        if ('parent_id' in options) {
            res.data = this.categories.findByParent(options.parent_id);
        } else {
            res.data = this.categories.data;
        }

        res.data = this.getNoDatesList(res.data);
        res.data.sort((a, b) => a.id - b.id);

        return res;
    }

    getImportTemplates() {
        const res = {
            data: structuredClone(this.templates.data),
        };

        return res;
    }

    getImportRules() {
        const res = {
            data: this.rules.map((item) => item.toPlain()),
        };

        return res;
    }

    getUserCurrencies(options = {}) {
        const res = {};

        if (options.curr_id) {
            const item = this.userCurrencies.findByCurrency(options.curr_id);
            res.data = [item];
        } else {
            res.data = this.userCurrencies.data;
        }

        res.data = this.getNoDatesList(res.data);
        res.data.sort((a, b) => a.id - b.id);

        return res;
    }

    getProfile() {
        return structuredClone(this.profile);
    }

    getTransactions(options = {}) {
        const defaultOptions = {
            onPage: 10,
        };

        const request = {
            ...defaultOptions,
            ...options,
        };

        const filtered = this.transactions.applyFilter(request);
        let items = filtered.clone();
        const { onPage } = request;
        const isDesc = request.order?.toLowerCase() === 'desc';

        if ('page' in request || 'range' in request || 'onPage' in request) {
            const targetPage = request.page ?? 1;
            const targetRange = request.range ?? 1;
            items = items.getPage(targetPage, request.onPage, targetRange, isDesc);
        }

        if (!isDesc) {
            items.data = items.sortAsc();
        }

        const res = {
            items: this.getNoDatesList(items.data),
            filter: this.transactions.getFilter(request),
            order: request.order ?? 'asc',
            pagination: {
                total: filtered.length,
                onPage,
                pagesCount: Math.ceil(filtered.length / onPage),
                page: request.page ?? 1,
            },
        };

        if (request.range) {
            res.pagination.range = request.range;
        }

        return res;
    }

    getStatistics(options = {}) {
        const defaultOptions = {
            type: EXPENSE,
            report: 'currency',
            group: 'week',
            limit: 5,
        };

        const request = {
            ...defaultOptions,
            ...options,
        };

        const res = this.transactions.getStatistics(request);
        return res;
    }

    getScheduledTransactions() {
        return {
            data: structuredClone(this.schedule.data),
        };
    }

    getReminders(options) {
        const res = this.reminders.clone();
        return res.applyFilter(options);
    }

    getState(request) {
        const res = {};

        const requestParams = Object.entries(AppState.dataRequestMap);
        requestParams.forEach(([param, method]) => {
            if (request[param]) {
                res[param] = this[method](request[param]);
            }
        });

        return res;
    }

    returnState(request, result = {}) {
        const res = { ...result };

        if (isObject(request)) {
            res.state = this.getState(request);
        }

        return res;
    }

    prepareChainedRequestData(request) {
        if (!request?.returnState?.transactions) {
            return request;
        }

        return {
            ...request,
            returnState: {
                ...request.returnState,
                transactions: this.getTransactionsListRequest(request.returnState.transactions),
            },
        };
    }

    isValidSettings(settings) {
        if (!isObject(settings)) {
            return false;
        }

        return sortSettings.every((prop) => (
            (prop in settings)
                ? availSortTypes.includes(settings[prop])
                : true
        ));
    }

    updateSettings(params) {
        if (!this.isValidSettings(params)) {
            return false;
        }

        const data = copyFields(params, availSettings);
        Object.assign(this.profile.settings, data);

        return {};
    }

    /**
     * User currencies
     */

    validateUserCurrency(params) {
        if (!isObject(params)) {
            return false;
        }

        // Check currency exist
        const currency = App.currency.getItem(params.curr_id);
        if (!currency) {
            return false;
        }

        // Check there is no entry for the same currency
        const userCurrency = this.userCurrencies.findByCurrency(currency.id);
        const isUpdate = !!params.id;
        if (userCurrency && (!isUpdate || (isUpdate && params.id !== userCurrency.id))) {
            return false;
        }

        return true;
    }

    createUserCurrency(params) {
        const resExpected = this.validateUserCurrency(params);
        if (!resExpected) {
            return false;
        }

        const data = copyFields(params, UserCurrency.availProps);

        const ind = this.userCurrencies.create(data);
        const item = this.userCurrencies.getItemByIndex(ind);

        return this.returnState(params.returnState, { id: item.id });
    }

    updateUserCurrency(params) {
        const original = this.userCurrencies.getItem(params.id);
        if (!original) {
            return false;
        }

        // Prepare expected item object
        const expectedItem = structuredClone(original);
        const data = copyFields(params, UserCurrency.availProps);
        Object.assign(expectedItem, data);

        const resExpected = this.validateUserCurrency(expectedItem);
        if (!resExpected) {
            return false;
        }

        // Prepare expected updates of user currencies list
        this.userCurrencies.update(expectedItem);

        return this.returnState(params.returnState);
    }

    deleteUserCurrencies(params) {
        const ids = asArray(params?.id).map((id) => parseInt(id, 10));
        if (!ids.length) {
            return false;
        }
        if (!ids.every((id) => this.userCurrencies.getItem(id))) {
            return false;
        }

        this.userCurrencies.deleteItems(ids);

        return this.returnState(params.returnState);
    }

    setUserCurrencyPos(params) {
        if (!isObject(params)) {
            return false;
        }

        const { id, pos } = params;
        if (!parseInt(id, 10) || !parseInt(pos, 10)) {
            return false;
        }

        if (!this.userCurrencies.setPos(id, pos)) {
            return false;
        }

        return this.returnState(params.returnState);
    }

    getUserCurrenciesByIndexes(indexes, returnIds = false) {
        return asArray(indexes).map((ind) => {
            const item = this.userCurrencies.getItemByIndex(ind);
            assert(item, `Invalid user currency index ${ind}`);
            return (returnIds) ? item.id : item;
        });
    }

    /**
     * Accounts
     */

    validateAccount(params) {
        if (!isObject(params)) {
            return false;
        }

        if (typeof params.name !== 'string' || params.name === '') {
            return false;
        }

        const type = parseInt(params.type, 10);
        if (typeof accountTypes[type] !== 'string') {
            return false;
        }

        // Check there is no account with same name
        const accObj = this.accounts.findByName(params.name);
        if (accObj && (!params.id || (params.id && params.id !== accObj.id))) {
            return false;
        }

        const currObj = App.currency.getItem(params.curr_id);
        if (!currObj) {
            return false;
        }

        if (params.icon_id && !App.icons.getItem(params.icon_id)) {
            return false;
        }

        if (!isValidValue(params.initbalance)) {
            return false;
        }
        if (!isValidValue(params.initlimit)) {
            return false;
        }

        return true;
    }

    createAccount(params) {
        const itemData = {
            ...Account.defaultProps,
            ...params,
        };

        const resExpected = this.validateAccount(itemData);
        if (!resExpected) {
            return false;
        }

        const data = copyFields(itemData, Account.availProps);
        data.owner_id = this.profile.owner_id;
        data.balance = data.initbalance;
        data.limit = data.initlimit;

        const ind = this.accounts.create(data);
        const item = this.accounts.getItemByIndex(ind);
        this.updatePersonAccounts();
        this.resetUserAccountsCache();

        return this.returnState(params.returnState, { id: item.id });
    }

    updateAccount(params) {
        const origAcc = this.accounts.getItem(params.id);
        if (!origAcc) {
            return false;
        }

        // Prepare expected account object
        const expAccount = structuredClone(origAcc);
        const data = copyFields(params, Account.availProps);
        data.owner_id = this.profile.owner_id;
        Object.assign(expAccount, data);

        const resExpected = this.validateAccount(expAccount);
        if (!resExpected) {
            return false;
        }

        const currency = App.currency.getItem(expAccount.curr_id);
        if (!currency) {
            return false;
        }

        const { precision } = currency;
        const balDiff = normalize(expAccount.initbalance - origAcc.initbalance, precision);
        if (parseFloat(balDiff.toFixed(precision)) !== 0) {
            expAccount.balance = normalize(origAcc.balance + balDiff, precision);
        }

        const limitDiff = normalize(expAccount.initlimit - origAcc.initlimit, precision);
        if (parseFloat(limitDiff.toFixed(precision)) !== 0) {
            expAccount.limit = normalize(origAcc.limit + limitDiff, precision);
        }

        // Prepare expected updates of transactions list
        this.transactions = this.transactions.updateAccount(this.accounts.data, expAccount);

        // Prepare expected updates of scheduled transactions list
        this.schedule = this.schedule.updateAccount(
            this.accounts.data,
            expAccount,
        );

        // Prepare expected updates of accounts list
        this.accounts.update(expAccount);

        this.transactions.updateResults(this.accounts);
        this.updatePersonAccounts();
        this.resetUserAccountsCache();

        return this.returnState(params.returnState);
    }

    deleteAccounts(params) {
        const ids = asArray(params?.id).map((id) => parseInt(id, 10));
        if (!ids.length) {
            return false;
        }
        if (!ids.every((id) => this.accounts.getItem(id))) {
            return false;
        }

        this.rules.deleteAccounts(ids);
        this.templates.deleteAccounts(ids);
        this.transactions = this.transactions.deleteAccounts(this.accounts.data, ids);
        this.schedule = this.schedule.deleteAccounts(
            this.accounts.data,
            ids,
        );

        // Prepare expected updates of accounts list
        this.accounts.deleteItems(ids);

        this.transactions.updateResults(this.accounts);
        this.updatePersonAccounts();
        this.resetUserAccountsCache();

        return this.returnState(params.returnState);
    }

    /* eslint-disable no-bitwise */
    showAccounts(params, show = true) {
        const itemIds = asArray(params?.id);

        for (const accountId of itemIds) {
            const account = this.accounts.getItem(accountId);
            if (!account) {
                return false;
            }

            if (show) {
                account.flags &= ~ACCOUNT_HIDDEN;
            } else {
                account.flags |= ACCOUNT_HIDDEN;
            }

            this.accounts.update(account);
        }

        this.resetUserAccountsCache();

        return this.returnState(params.returnState);
    }
    /* eslint-enable no-bitwise */

    setAccountPos(params) {
        if (!isObject(params)) {
            return false;
        }

        const { id, pos } = params;
        if (!parseInt(id, 10) || !parseInt(pos, 10)) {
            return false;
        }

        if (!this.accounts.setPos(id, pos)) {
            return false;
        }

        this.resetUserAccountsCache();

        return this.returnState(params.returnState);
    }

    resetUserAccountsCache() {
        this.userAccountsCache = null;
        this.sortedAccountsCache = null;
    }

    cacheUserAccounts() {
        if (this.userAccountsCache) {
            return;
        }

        this.userAccountsCache = this.accounts.getUserAccounts();
        this.userAccountsCache.sortByVisibility();
    }

    getUserAccounts() {
        this.cacheUserAccounts();
        return this.userAccountsCache;
    }

    sortAccounts() {
        const sortMode = this.getAccountsSortMode();
        this.accounts.sortBy(sortMode);
    }

    getSortedUserAccounts() {
        if (!this.sortedAccountsCache) {
            const sortMode = this.getAccountsSortMode();
            const userAccounts = this.getUserAccounts();
            const visible = userAccounts.getVisible();
            visible.sortBy(sortMode);
            const hidden = userAccounts.getHidden();
            hidden.sortBy(sortMode);
            this.sortedAccountsCache = AccountsList.create([
                ...visible.data,
                ...hidden.data,
            ]);
        }

        return this.sortedAccountsCache;
    }

    getAccountsByIndexes(indexes, returnIds = false) {
        const userAccounts = this.getUserAccounts();

        return asArray(indexes).map((ind) => {
            const item = userAccounts.getItemByIndex(ind);
            assert(item, `Invalid account index ${ind}`);
            return (returnIds) ? item.id : item;
        });
    }

    getSortedAccountsByIndexes(indexes, returnIds = false) {
        const sortedAccounts = this.getSortedUserAccounts();

        return asArray(indexes).map((ind) => {
            const item = sortedAccounts.getItemByIndex(ind);
            assert(item, `Invalid account index ${ind}`);
            return (returnIds) ? item.id : item;
        });
    }

    getFirstAccount() {
        const [account] = this.getAccountsByIndexes(0);
        return account;
    }

    /**
     * Returns another user account id if possible
     * Returns first account if no id specified
     * Returns zero if no account found
     * @param {number} accountId - identifier of account
     */
    getNextAccount(accountId = 0) {
        this.cacheUserAccounts();

        if (!accountId) {
            return this.userAccountsCache.indexToId(0);
        }

        if (this.userAccountsCache.length < 2) {
            return 0;
        }
        let ind = this.userAccountsCache.getIndexById(accountId);
        if (ind === -1) {
            return 0;
        }

        ind = (ind === this.userAccountsCache.length - 1) ? 0 : ind + 1;

        return this.userAccountsCache.indexToId(ind);
    }

    /**
     * Persons
     */

    validatePerson(params) {
        if (!isObject(params)) {
            return false;
        }

        if (typeof params.name !== 'string' || params.name === '') {
            return false;
        }

        // Check there is no person with same name
        const personObj = this.persons.findByName(params.name);
        if (personObj && (!params.id || (params.id && params.id !== personObj.id))) {
            return false;
        }

        if (!('flags' in params)) {
            return false;
        }

        return true;
    }

    createPerson(params) {
        const itemData = {
            ...Person.defaultProps,
            ...params,
        };

        const resExpected = this.validatePerson(itemData);
        if (!resExpected) {
            return false;
        }

        const data = copyFields(itemData, Person.availProps);
        const ind = this.persons.create(data);
        const item = this.persons.getItemByIndex(ind);
        item.accounts = [];

        this.resetPersonsCache();

        return this.returnState(params.returnState, { id: item.id });
    }

    updatePerson(params) {
        const origPerson = this.persons.getItem(params.id);
        if (!origPerson) {
            return false;
        }

        const expPerson = structuredClone(origPerson);
        const data = copyFields(params, Person.availProps);
        Object.assign(expPerson, data);

        const resExpected = this.validatePerson(expPerson);
        if (!resExpected) {
            return false;
        }

        this.persons.update(expPerson);
        this.resetPersonsCache();

        return this.returnState(params.returnState);
    }

    deletePersons(params) {
        const ids = asArray(params?.id);
        if (!ids.length) {
            return false;
        }

        if (!ids.every((id) => this.persons.getItem(id))) {
            return false;
        }

        const accountsToDelete = ids.flatMap((id) => this.getPersonAccounts(id));

        this.rules.deletePersons(ids);
        this.persons.deleteItems(ids);
        this.resetPersonsCache();

        // Prepare expected updates of transactions
        this.transactions = this.transactions.deleteAccounts(this.accounts.data, accountsToDelete);
        this.schedule = this.schedule.deleteAccounts(
            this.accounts.data,
            accountsToDelete,
        );

        this.accounts.deleteItems(accountsToDelete);
        this.transactions.updateResults(this.accounts);

        return this.returnState(params.returnState);
    }

    /* eslint-disable no-bitwise */
    showPersons(params, show = true) {
        const itemIds = asArray(params?.id);
        for (const personId of itemIds) {
            const person = this.persons.getItem(personId);
            if (!person) {
                return false;
            }

            if (show) {
                person.flags &= ~PERSON_HIDDEN;
            } else {
                person.flags |= PERSON_HIDDEN;
            }

            this.persons.update(person);
        }

        this.resetPersonsCache();

        return this.returnState(params.returnState);
    }
    /* eslint-enable no-bitwise */

    setPersonPos(params) {
        if (!isObject(params)) {
            return false;
        }

        const { id, pos } = params;
        if (!parseInt(id, 10) || !parseInt(pos, 10)) {
            return false;
        }

        if (!this.persons.setPos(id, pos)) {
            return false;
        }

        this.resetPersonsCache();

        return this.returnState(params.returnState);
    }

    getPersonAccounts(personId) {
        const person = this.persons.getItem(personId);
        if (Array.isArray(person?.accounts)) {
            return person.accounts.map((item) => item.id);
        }

        return [];
    }

    getPersonAccount(personId, currencyId) {
        const pId = parseInt(personId, 10);
        const currId = parseInt(currencyId, 10);
        if (!pId || !currId) {
            return null;
        }

        const accObj = this.accounts.find(
            (item) => item.owner_id === pId && item.curr_id === currId,
        );

        return structuredClone(accObj);
    }

    /**
     * Search for account of person in specified currency
     * In case no such account exist create new account with expected properties
     * @param {number} personId - identifier of person
     * @param {number} currencyId - identifier of currency
     */
    getExpectedPersonAccount(personId, currencyId) {
        const pId = parseInt(personId, 10);
        const currId = parseInt(currencyId, 10);
        if (!pId || !currId) {
            return null;
        }

        let accObj = this.getPersonAccount(pId, currId);
        if (accObj) {
            return accObj;
        }

        accObj = {
            owner_id: pId,
            name: `acc_${pId}_${currId}`,
            initbalance: 0,
            balance: 0,
            curr_id: currId,
            icon_id: 0,
        };

        const ind = this.accounts.create(accObj);
        return this.accounts.getItemByIndex(ind);
    }

    resetPersonsCache() {
        this.personsCache = null;
        this.sortedPersonsCache = null;
    }

    cachePersons() {
        if (this.personsCache) {
            return;
        }

        this.personsCache = this.persons.clone();
        this.personsCache.sortByVisibility();
    }

    sortPersons() {
        const sortMode = this.getPersonsSortMode();
        this.persons.sortBy(sortMode);
    }

    getSortedPersons() {
        if (!this.sortedPersonsCache) {
            const sortMode = this.getPersonsSortMode();
            const visible = this.persons.getVisible();
            visible.sortBy(sortMode);
            const hidden = this.persons.getHidden();
            hidden.sortBy(sortMode);
            this.sortedPersonsCache = PersonsList.create([
                ...visible.data,
                ...hidden.data,
            ]);
        }

        return this.sortedPersonsCache;
    }

    getPersonsByIndexes(indexes, returnIds = false) {
        this.cachePersons();

        return asArray(indexes).map((ind) => {
            const item = this.personsCache.getItemByIndex(ind);
            assert(item, `Invalid person index ${ind}`);
            return (returnIds) ? item.id : item;
        });
    }

    getSortedPersonsByIndexes(indexes, returnIds = false) {
        const sortedPersons = this.getSortedPersons();

        return asArray(indexes).map((ind) => {
            const item = sortedPersons.getItemByIndex(ind);
            assert(item, `Invalid person index ${ind}`);
            return (returnIds) ? item.id : item;
        });
    }

    getFirstPerson() {
        const [person] = this.getPersonsByIndexes(0);
        return person;
    }

    /**
     * Categories
     */

    validateCategory(params) {
        if (!isObject(params)) {
            return false;
        }

        if (typeof params.name !== 'string' || params.name === '') {
            return false;
        }

        // Check there is no category with same name
        const category = this.categories.findByName(params.name);
        if (category && (!params.id || (params.id && params.id !== category.id))) {
            return false;
        }

        // Check parent category
        // - If parent is set, it must refer to existing category
        // - Parent category could be only top level category
        // - Category can't be parent to itself
        let parent = null;
        if (params.parent_id !== 0) {
            parent = this.categories.getItem(params.parent_id);
            if (
                !parent
                || parent.parent_id !== 0
                || (params.id && parent.id === params.id)
            ) {
                return false;
            }
        }

        if (params.type !== 0 && !Transaction.availTypes.includes(params.type)) {
            return false;
        }

        // Transaction type of subcategory must be the same as parent
        if (parent && parent.type !== params.type) {
            return false;
        }

        return true;
    }

    createCategory(params) {
        const defaults = {
            parent_id: 0,
        };
        const itemData = {
            ...defaults,
            ...params,
        };

        const resExpected = this.validateCategory(itemData);
        if (!resExpected) {
            return false;
        }

        const data = copyFields(itemData, Category.availProps);
        const ind = this.categories.create(data);
        const item = this.categories.getItemByIndex(ind);
        this.sortCategories();

        return this.returnState(params.returnState, { id: item.id });
    }

    updateCategory(params) {
        const origItem = this.categories.getItem(params.id);
        if (!origItem) {
            return false;
        }

        const expItem = structuredClone(origItem);
        const data = copyFields(params, Category.availProps);
        Object.assign(expItem, data);

        const resExpected = this.validateCategory(expItem);
        if (!resExpected) {
            return false;
        }

        this.categories.update(expItem);

        const children = this.categories.findByParent(expItem.id);
        children.forEach((item) => {
            // Update transaction type of children categories
            const category = {
                ...item,
                type: expItem.type,
            };
            // In case current item is subcategory then set same parent category for
            // children categories to avoid third level of nesting
            if (expItem.parent_id !== 0) {
                category.parent_id = expItem.parent_id;
            }

            this.categories.update(category);
        });

        this.sortCategories();

        return this.returnState(params.returnState);
    }

    deleteCategories(params) {
        const ids = asArray(params?.id);
        if (!ids.length) {
            return false;
        }

        if (!ids.every((id) => this.categories.getItem(id))) {
            return false;
        }

        const itemsToDelete = [...ids];
        const childrenCategories = ids.flatMap((id) => (
            this.categories.findByParent(id).map((item) => item.id)
        ));

        const removeChildren = params.removeChildren ?? true;
        if (removeChildren) {
            itemsToDelete.push(...childrenCategories);
        } else {
            childrenCategories.forEach((id) => {
                const item = this.categories.getItem(id);

                this.categories.update({
                    ...item,
                    parent_id: 0,
                });
            });
        }

        // Prepare expected updates of transactions
        this.transactions = this.transactions.deleteCategories(itemsToDelete);
        this.schedule = this.schedule.deleteCategories(itemsToDelete);
        this.rules.deleteCategories(...itemsToDelete);

        this.categories.deleteItems(itemsToDelete);

        this.sortCategories();

        return this.returnState(params.returnState);
    }

    setCategoryPos(params) {
        if (!isObject(params)) {
            return false;
        }

        const { id, pos } = params;
        if (!parseInt(id, 10) || !parseInt(pos, 10)) {
            return false;
        }

        if (!this.categories.setPos(id, pos, params.parent_id)) {
            return false;
        }

        this.sortCategories();

        return this.returnState(params.returnState);
    }

    sortCategories() {
        const sortMode = this.getCategoriesSortMode();
        this.categories.sortBy(sortMode);
    }

    getSortedCategories() {
        if (!this.sortedCategoriesCache) {
            const sortMode = this.getCategoriesSortMode();

            const sortedItems = transTypes.flatMap((type) => {
                const typeItems = this.categories.filter((item) => item.type === type);
                const items = CategoryList.create(typeItems);
                items.sortBy(sortMode);

                const mainCategories = items.findByParent(0);
                return mainCategories.flatMap((item) => {
                    const children = items.findByParent(item.id);
                    return [item, ...children];
                });
            });

            this.sortedCategoriesCache = CategoryList.create(sortedItems);
        }

        return this.sortedCategoriesCache;
    }

    getCategoriesByNames(names, returnIds = false) {
        return asArray(names).map((name) => {
            const item = this.categories.findByName(name);
            assert(item, `Category '${name}' not found`);
            return (returnIds) ? item.id : item;
        });
    }

    getCategoriesForType(type) {
        const res = [{ id: 0 }];

        this.categories.forEach((category) => {
            if (
                category.parent_id !== 0
                || (
                    category.type !== 0
                    && type !== null
                    && category.type !== type
                )
            ) {
                return;
            }

            res.push(category);

            const children = this.categories.findByParent(category.id);
            children.forEach((item) => {
                assert(item.type === category.type, `Invalid transaction type: ${item.type}, ${category.type} is expected`);

                res.push(item);
            });
        });

        return res;
    }

    /**
     * Transactions
     */

    validateTransaction(params) {
        if (!isObject(params)) {
            return false;
        }

        if (!Transaction.availTypes.includes(params.type)) {
            return false;
        }
        // Amount must be greather than zero
        if (params.src_amount <= 0 || params.dest_amount <= 0) {
            return false;
        }
        // Source and destination amounts must be equal if currencies are same
        if (params.src_curr === params.dest_curr && params.src_amount !== params.dest_amount) {
            return false;
        }

        const srcCurr = App.currency.getItem(params.src_curr);
        if (!srcCurr) {
            return false;
        }
        const destCurr = App.currency.getItem(params.dest_curr);
        if (!destCurr) {
            return false;
        }

        if (params.type === DEBT && ('person_id' in params)) {
            if ('op' in params && params.op !== 1 && params.op !== 2) {
                return false;
            }

            const person = this.persons.getItem(params.person_id);
            if (!person) {
                return false;
            }

            if (params.acc_id) {
                const account = this.accounts.getItem(params.acc_id);
                if (
                    !account
                    || (params.op === 2 && srcCurr.id !== account.curr_id)
                    || (params.op === 1 && destCurr.id !== account.curr_id)
                ) {
                    return false;
                }
            }
        }

        if (
            ('src_id' in params)
            && ('dest_id' in params)
            && (params.src_id === params.dest_id)
        ) {
            return false;
        }

        if (params.src_id) {
            if (params.type === INCOME) {
                return false;
            }

            const account = this.accounts.getItem(params.src_id);
            if (
                !account
                || srcCurr.id !== account.curr_id
                || (params.type !== DEBT && account.owner_id !== this.profile.owner_id)
            ) {
                return false;
            }

            if (
                params.type === LIMIT_CHANGE
                && account.type !== ACCOUNT_TYPE_CREDIT_CARD
            ) {
                return false;
            }
        } else if (params.type === EXPENSE || params.type === TRANSFER) {
            return false;
        }

        if (params.dest_id) {
            if (params.type === EXPENSE) {
                return false;
            }

            const account = this.accounts.getItem(params.dest_id);
            if (
                !account
                || destCurr.id !== account.curr_id
                || (params.type !== DEBT && account.owner_id !== this.profile.owner_id)
            ) {
                return false;
            }

            if (
                params.type === LIMIT_CHANGE
                && account.type !== ACCOUNT_TYPE_CREDIT_CARD
            ) {
                return false;
            }
        } else if (params.type === INCOME || params.type === TRANSFER) {
            return false;
        }

        if (params.category_id !== 0) {
            const category = this.categories.getItem(params.category_id);
            if (!category) {
                return false;
            }
        }

        if ('date' in params && !isInt(params.date)) {
            return false;
        }

        return true;
    }

    /**
     * Convert real transaction object to request
     * Currently only DEBT affected:
     *     (person_id, acc_id, op) parameters are used instead of (src_id, dest_id)
     * @param {Object} transaction - transaction object
     */
    transactionToRequest(transaction) {
        if (!transaction) {
            return transaction;
        }

        const res = structuredClone(transaction);
        if (transaction.type !== DEBT) {
            return res;
        }

        const srcAcc = this.accounts.getItem(transaction.src_id);
        const destAcc = this.accounts.getItem(transaction.dest_id);
        if (srcAcc && srcAcc.owner_id !== this.profile.owner_id) {
            res.op = 1;
            res.person_id = srcAcc.owner_id;
            res.acc_id = (destAcc) ? destAcc.id : 0;
        } else if (destAcc && destAcc.owner_id !== this.profile.owner_id) {
            res.op = 2;
            res.person_id = destAcc.owner_id;
            res.acc_id = (srcAcc) ? srcAcc.id : 0;
        } else {
            throw new Error('Invalid transaction');
        }

        delete res.src_id;
        delete res.dest_id;

        return res;
    }

    /** Prepares transaction list request parameters */
    getTransactionsListRequest(params) {
        const res = {};

        if ('order' in params) {
            res.order = params.order;
        }
        if ('type' in params) {
            res.type = params.type;
        }
        if ('accounts' in params) {
            res.acc_id = params.accounts;
        }
        if ('persons' in params) {
            res.person_id = params.persons;
        }
        if ('categories' in params) {
            res.category_id = params.categories;
        }
        if ('startDate' in params) {
            res.stdate = params.startDate;
        }
        if ('endDate' in params) {
            res.enddate = params.endDate;
        }
        if ('search' in params) {
            res.search = params.search;
        }
        if ('onPage' in params) {
            res.count = params.onPage;
        }
        if ('page' in params) {
            res.page = params.page;
        }
        if ('range' in params) {
            res.range = params.range;
        }

        return res;
    }

    getExpectedTransaction(params) {
        const isPersonRequest = ('person_id' in params);
        const fields = (params.type === DEBT && isPersonRequest)
            ? Transaction.debtProps
            : Transaction.availProps;
        const itemData = {
            ...Transaction.defaultProps,
            ...params,
        };

        const res = copyFields(itemData, fields);
        if (itemData.id) {
            res.id = itemData.id;
        }

        if (res.type !== DEBT || (res.type === DEBT && !isPersonRequest)) {
            return res;
        }

        const reqCurr = (res.op === 1) ? res.src_curr : res.dest_curr;
        const personAcc = this.getExpectedPersonAccount(res.person_id, reqCurr);
        if (!personAcc) {
            return null;
        }

        if (res.op === 1) {
            res.src_id = personAcc.id;
            res.dest_id = res.acc_id;
        } else {
            res.src_id = res.acc_id;
            res.dest_id = personAcc.id;
        }

        delete res.op;
        delete res.person_id;
        delete res.acc_id;

        return res;
    }

    updatePersonAccounts() {
        for (const person of this.persons.data) {
            person.accounts = this.accounts.filter((item) => item.owner_id === person.id)
                .map((item) => ({ id: item.id, balance: item.balance, curr_id: item.curr_id }));
        }
    }

    createTransaction(params) {
        const itemData = {
            ...Transaction.defaultProps,
            ...params,
        };

        let resExpected = this.validateTransaction(itemData);
        if (!resExpected) {
            return false;
        }

        // Prepare expected transaction object
        const expTrans = this.getExpectedTransaction(itemData);
        if (!expTrans) {
            return false;
        }
        expTrans.pos = 0;

        resExpected = checkFields(expTrans, Transaction.availProps);
        if (!resExpected) {
            return false;
        }

        // Prepare expected updates of accounts
        this.accounts = this.accounts.createTransaction(expTrans);

        // Prepare expected updates of transactions
        const ind = this.transactions.create(expTrans);
        this.transactions.updateResults(this.accounts);
        this.updatePersonAccounts();

        const item = this.transactions.getItemByIndex(ind);

        if (itemData.reminder_id) {
            this.confirmReminder({
                id: itemData.reminder_id,
                transaction_id: item.id,
            });
        }

        return this.returnState(params.returnState, { id: item.id });
    }

    updateTransaction(params) {
        const origTrans = this.transactions.getItem(params.id);
        if (!origTrans) {
            return false;
        }

        // Convert original transaction to request form
        // (only for DEBT: person_id, acc_id, op fields)
        const updTrans = this.transactionToRequest(origTrans);
        Object.assign(updTrans, params);

        const correct = this.validateTransaction(updTrans);
        if (!correct) {
            return false;
        }

        // Prepare expected transaction object
        const expTrans = this.getExpectedTransaction(updTrans);
        if (!expTrans) {
            return false;
        }

        // Prepare expected updates of accounts
        this.accounts = this.accounts.updateTransaction(origTrans, expTrans);

        // Prepare expected updates of transactions
        this.transactions.update(expTrans);
        this.transactions.updateResults(this.accounts);
        this.updatePersonAccounts();

        return this.returnState(params.returnState);
    }

    deleteTransactions(params) {
        const ids = asArray(params?.id);
        if (!ids.length) {
            return false;
        }

        const itemsToDelete = ids.map((id) => this.transactions.getItem(id));
        if (!itemsToDelete.every((item) => !!item)) {
            return false;
        }

        // Prepare expected updates of transactions list
        this.accounts = this.accounts.deleteTransactions(itemsToDelete);
        this.reminders.deleteTransactions(ids);
        this.transactions.deleteItems(ids);
        this.transactions.updateResults(this.accounts);
        this.updatePersonAccounts();

        return this.returnState(params.returnState);
    }

    setTransactionCategory(params) {
        const ids = asArray(params?.id);
        if (ids.length === 0) {
            return false;
        }

        if (!ids.every((itemId) => this.transactions.getItem(itemId))) {
            return false;
        }

        const categoryId = parseInt(params.category, 10);
        if (categoryId !== 0 && !this.categories.getItem(params.category)) {
            return false;
        }

        if (!this.transactions.setCategory(params.id, params.category)) {
            return false;
        }

        return this.returnState(params.returnState);
    }

    setTransactionPos(params) {
        if (!parseInt(params?.id, 10) || !parseInt(params?.pos, 10)) {
            return false;
        }

        const transactions = this.transactions.clone();
        if (!transactions.setPos(params.id, params.pos)) {
            return false;
        }
        this.transactions = transactions;
        this.transactions.updateResults(this.accounts);

        return this.returnState(params.returnState);
    }

    isAvailableTransactionType(type) {
        assert(Transaction.availTypes.includes(type), 'Invalid transaction type');

        this.cacheUserAccounts();

        if (type === EXPENSE || type === INCOME) {
            return (this.userAccountsCache.length > 0);
        }
        if (type === TRANSFER) {
            return (this.userAccountsCache.length > 1);
        }
        if (type === DEBT) {
            return (this.persons.length > 0);
        }

        // LIMIT_CHANGE
        return this.userAccountsCache.some((item) => item.type === ACCOUNT_TYPE_CREDIT_CARD);
    }

    /**
     * Scheduled transactions
     */

    validateScheduledTransaction(params) {
        if (!isObject(params)) {
            return false;
        }

        if (!Transaction.availTypes.includes(params.type)) {
            return false;
        }
        // Amount must be greather than zero
        if (params.src_amount <= 0 || params.dest_amount <= 0) {
            return false;
        }
        // Source and destination amounts must be equal if currencies are same
        if (params.src_curr === params.dest_curr && params.src_amount !== params.dest_amount) {
            return false;
        }

        const srcCurr = App.currency.getItem(params.src_curr);
        if (!srcCurr) {
            return false;
        }
        const destCurr = App.currency.getItem(params.dest_curr);
        if (!destCurr) {
            return false;
        }

        if (params.type === DEBT && ('person_id' in params)) {
            const person = this.persons.getItem(params.person_id);
            if (!person) {
                return false;
            }

            if ('op' in params && params.op !== 1 && params.op !== 2) {
                return false;
            }

            if (params.acc_id) {
                const account = this.accounts.getItem(params.acc_id);
                if (
                    !account
                    || (params.op === 2 && srcCurr.id !== account.curr_id)
                    || (params.op === 1 && destCurr.id !== account.curr_id)
                ) {
                    return false;
                }
            }
        }

        if (
            ('src_id' in params)
            && ('dest_id' in params)
            && (params.src_id === params.dest_id)
        ) {
            return false;
        }

        let srcAccount = null;
        if (params.src_id) {
            if (params.type === INCOME) {
                return false;
            }

            srcAccount = this.accounts.getItem(params.src_id);
            if (
                !srcAccount
                || (srcCurr.id !== srcAccount.curr_id)
                || (params.type !== DEBT && srcAccount.owner_id !== this.profile.owner_id)
            ) {
                return false;
            }

            if (
                params.type === LIMIT_CHANGE
                && srcAccount.type !== ACCOUNT_TYPE_CREDIT_CARD
            ) {
                return false;
            }
        } else if (params.type === EXPENSE || params.type === TRANSFER) {
            return false;
        }

        let destAccount = null;
        if (params.dest_id) {
            if (params.type === EXPENSE) {
                return false;
            }

            destAccount = this.accounts.getItem(params.dest_id);
            if (
                !destAccount
                || (destCurr.id !== destAccount.curr_id)
                || (params.type !== DEBT && destAccount.owner_id !== this.profile.owner_id)
            ) {
                return false;
            }

            if (
                params.type === LIMIT_CHANGE
                && destAccount.type !== ACCOUNT_TYPE_CREDIT_CARD
            ) {
                return false;
            }
        } else if (params.type === INCOME || params.type === TRANSFER) {
            return false;
        }

        if (params.type === DEBT && !('person_id' in params)) {
            // Both source and destination are accounts of person
            if (
                srcAccount
                && srcAccount.owner_id !== this.profile.owner_id
                && destAccount
                && destAccount.owner_id !== this.profile.owner_id
            ) {
                return false;
            }

            // Neither source nor destination are accounts of person
            if (
                (!srcAccount || srcAccount.owner_id === this.profile.owner_id)
                && (!destAccount || destAccount.owner_id === this.profile.owner_id)
            ) {
                return false;
            }
        }

        if (params.category_id !== 0) {
            const category = this.categories.getItem(params.category_id);
            if (!category) {
                return false;
            }
        }

        if ('start_date' in params && !isInt(params.start_date)) {
            return false;
        }

        if ('end_date' in params && !isInt(params.end_date) && params.end_date !== null) {
            return false;
        }

        // End date must be greater than start date
        if (
            isInt(params.start_date)
            && isInt(params.end_date)
            && params.start_date >= params.end_date
        ) {
            return false;
        }

        if (!ScheduledTransaction.isValidIntervalType(params.interval_type)) {
            return false;
        }

        if (
            !ScheduledTransaction.isValidIntervalStep(params.interval_step, params.interval_type)
        ) {
            return false;
        }

        const offsets = asArray(params.interval_offset);

        if (
            !offsets.every((offset) => (
                ScheduledTransaction.isValidIntervalOffset(
                    offset,
                    params.interval_type,
                )
            ))
        ) {
            return false;
        }

        return true;
    }

    getExpectedScheduledTransaction(params) {
        const isPersonRequest = ('person_id' in params);
        const fields = (params.type === DEBT && isPersonRequest)
            ? ScheduledTransaction.debtProps
            : ScheduledTransaction.availProps;
        const itemData = {
            ...ScheduledTransaction.defaultProps,
            ...params,
        };

        const res = copyFields(itemData, fields);
        res.interval_offset = asArray(res.interval_offset);

        if (res.type !== DEBT || (res.type === DEBT && !isPersonRequest)) {
            return res;
        }

        const reqCurr = (res.op === 1) ? res.src_curr : res.dest_curr;
        const personAcc = this.getExpectedPersonAccount(res.person_id, reqCurr);
        if (!personAcc) {
            return null;
        }

        if (res.op === 1) {
            res.src_id = personAcc.id;
            res.dest_id = res.acc_id;
        } else {
            res.src_id = res.acc_id;
            res.dest_id = personAcc.id;
        }

        delete res.op;
        delete res.person_id;
        delete res.acc_id;

        return res;
    }

    createScheduledTransaction(params) {
        const itemData = {
            ...ScheduledTransaction.defaultProps,
            ...params,
        };

        let resExpected = this.validateScheduledTransaction(itemData);
        if (!resExpected) {
            return false;
        }

        const expItem = this.getExpectedScheduledTransaction(itemData);
        if (!expItem) {
            return false;
        }

        resExpected = checkFields(expItem, ScheduledTransaction.requiredProps);
        if (!resExpected) {
            return false;
        }

        const ind = this.schedule.create(expItem);
        const item = this.schedule.getItemByIndex(ind);

        if (!this.createReminders(item.id)) {
            return false;
        }

        return this.returnState(params.returnState, { id: item.id });
    }

    updateScheduledTransaction(params) {
        const origItem = this.schedule.getItem(params.id);
        if (!origItem) {
            return false;
        }

        const itemData = structuredClone(origItem);
        const data = copyFields(params, ScheduledTransaction.availProps);
        Object.assign(itemData, data);

        const resExpected = this.validateScheduledTransaction(itemData);
        if (!resExpected) {
            return false;
        }

        const expItem = this.getExpectedScheduledTransaction(itemData);
        if (!expItem) {
            return false;
        }

        this.schedule.update(expItem);

        const remindersChanged = this.isRemindersChanged(origItem, expItem);
        if (remindersChanged && !this.updateReminders(expItem.id)) {
            return false;
        }

        return this.returnState(params.returnState);
    }

    isRemindersChanged(item, params) {
        if (
            item.start_date !== params.start_date
            || item.end_date !== params.end_date
            || item.interval_type !== params.interval_type
            || item.interval_step !== params.interval_step
        ) {
            return true;
        }

        const origOffsets = asArray(item.interval_offset);
        const newOffsets = asArray(params.interval_offset);
        return (
            (origOffsets.length !== newOffsets.length)
            || (origOffsets.some((offset) => !newOffsets.includes(offset)))
        );
    }

    deleteScheduledTransaction(params) {
        const ids = asArray(params?.id);
        if (!ids.length) {
            return false;
        }

        const itemsToDelete = ids.map((id) => this.schedule.getItem(id));
        if (!itemsToDelete.every((item) => !!item)) {
            return false;
        }

        this.schedule.deleteItems(ids);

        if (!this.deleteReminders(ids)) {
            return false;
        }

        return this.returnState(params.returnState);
    }

    createReminders(scheduleId) {
        const item = this.schedule.getItem(scheduleId);
        if (!item) {
            return false;
        }

        const reminderDates = item.getReminders({
            endDate: App.dates.now.getTime(),
        });
        return reminderDates.every((timestamp) => (
            this.createReminder({
                schedule_id: scheduleId,
                state: REMINDER_SCHEDULED,
                date: timeToSeconds(timestamp),
                transaction_id: 0,
            })
        ));
    }

    updateReminders(scheduleId) {
        this.deleteReminders(scheduleId);
        return this.createReminders(scheduleId);
    }

    deleteReminders(scheduleId) {
        this.reminders.deleteRemindersBySchedule(scheduleId);
        return true;
    }

    /**
     * Scheduled transactions reminders
     */

    validateReminder(params) {
        if (!isObject(params)) {
            return false;
        }

        if (!checkFields(params, Reminder.availProps)) {
            return false;
        }

        if (params.schedule_id !== 0) {
            const schedule = this.schedule.getItem(params.schedule_id);
            if (!schedule) {
                return false;
            }
        }

        if (!Reminder.isValidState(params.state)) {
            return false;
        }

        if ('date' in params && !isInt(params.date)) {
            return false;
        }

        if (params.transaction_id !== 0) {
            const transaction = this.transactions.getItem(params.transaction_id);
            if (!transaction) {
                return false;
            }

            const reminder = this.reminders.getReminderByTransaction(params.transaction_id);
            if (reminder && reminder.id !== params.id) {
                return false;
            }
        }

        if (
            (params.state === REMINDER_CONFIRMED && params.transaction_id === 0)
            || (params.state !== REMINDER_CONFIRMED && params.transaction_id !== 0)
        ) {
            return false;
        }

        return true;
    }

    createReminder(params) {
        const itemData = {
            ...Reminder.defaultProps,
            ...params,
        };

        const resExpected = this.validateReminder(itemData);
        if (!resExpected) {
            return false;
        }

        const data = copyFields(itemData, Reminder.availProps);
        const ind = this.reminders.create(data);
        const item = this.reminders.getItemByIndex(ind);

        return this.returnState(params.returnState, { id: item.id });
    }

    updateReminder(params) {
        const origItem = this.reminders.getItem(params.id);
        if (!origItem) {
            return false;
        }

        const expItem = structuredClone(origItem);
        const data = copyFields(params, Reminder.availProps);
        Object.assign(expItem, data);

        const resExpected = this.validateReminder(expItem);
        if (!resExpected) {
            return false;
        }

        this.reminders.update(expItem);

        return this.returnState(params.returnState);
    }

    deleteReminder(params) {
        const ids = asArray(params?.id);
        if (!ids.length) {
            return false;
        }

        const itemsToDelete = ids.map((id) => this.reminders.getItem(id));
        if (!itemsToDelete.every((item) => !!item)) {
            return false;
        }

        this.reminders.deleteItems(ids);

        return this.returnState(params.returnState);
    }

    getDefaultReminderTransaction(id) {
        const reminder = this.reminders.getItem(id);
        const schedule = this.schedule.getItem(reminder?.schedule_id);
        if (!reminder) {
            return null;
        }

        return {
            type: schedule.type,
            src_id: schedule.src_id,
            dest_id: schedule.dest_id,
            src_amount: schedule.src_amount,
            dest_amount: schedule.dest_amount,
            src_curr: schedule.src_curr,
            dest_curr: schedule.dest_curr,
            category_id: schedule.category_id,
            date: reminder.date,
            comment: schedule.comment,
        };
    }

    confirmReminder(params) {
        let transactionId = params?.transaction_id;
        if (typeof transactionId === 'undefined') {
            const transaction = this.getDefaultReminderTransaction(params.id);
            const res = this.createTransaction(transaction);
            transactionId = res?.id;
        }

        return this.updateReminder({
            id: params.id,
            state: REMINDER_CONFIRMED,
            transaction_id: transactionId,
        });
    }

    cancelReminder(params) {
        const origItem = this.reminders.getItem(params.id);
        if (!origItem) {
            return false;
        }

        if (origItem.transaction_id !== 0) {
            this.deleteTransactions({ id: origItem.transaction_id });
        }

        return this.updateReminder({
            id: params.id,
            state: REMINDER_CANCELLED,
            transaction_id: 0,
        });
    }

    confirmReminders(params) {
        const ids = asArray(params?.id);
        if (!ids.length) {
            return false;
        }

        if (!ids.every((id) => this.confirmReminder({ id }))) {
            return false;
        }

        return this.returnState(params.returnState);
    }

    cancelReminders(params) {
        const ids = asArray(params?.id);
        if (!ids.length) {
            return false;
        }

        if (!ids.every((id) => this.cancelReminder({ id }))) {
            return false;
        }

        return this.returnState(params.returnState);
    }

    /**
     * Import templates
     */
    validateTemplate(params) {
        if (!isObject(params)) {
            return false;
        }

        if (!checkFields(params, ImportTemplate.availProps)) {
            return false;
        }

        if (typeof params.name !== 'string' || params.name.length === 0) {
            return false;
        }

        if (params.account_id) {
            const account = this.accounts.getItem(params.account_id);
            if (!account || account.owner_id !== this.profile.owner_id) {
                return false;
            }
        }

        if (
            typeof params.first_row !== 'number'
            || Number.isNaN(params.first_row)
            || params.first_row < 1
        ) {
            return false;
        }

        if (!isObject(params.columns)) {
            return false;
        }
        // Check every column value is present and have correct value
        return Object.values(ImportTemplate.columnsMap).every((columnName) => (
            (columnName in params.columns)
            && isInt(params.columns[columnName])
            && params.columns[columnName] > 0
        ));
    }

    templateFromRequest(request) {
        if (!request) {
            return request;
        }

        const origItem = this.templates.getItem(request.id) ?? { columns: {} };
        const res = structuredClone(origItem);
        const data = copyFields(request, ImportTemplate.availProps);
        Object.assign(res, data);

        Object.keys(ImportTemplate.columnsMap).forEach((columnName) => {
            const targetProp = ImportTemplate.columnsMap[columnName];
            if (request[columnName]) {
                res.columns[targetProp] = request[columnName];
            }
        });

        return res;
    }

    createTemplate(params) {
        const defaults = {
            type_id: 0,
            account_id: 0,
        };
        const itemData = {
            ...defaults,
            ...params,
        };

        const resExpected = this.validateTemplate(itemData);
        if (!resExpected) {
            return false;
        }

        const data = copyFields(itemData, ImportTemplate.availProps);
        data.columns = {};
        Object.values(ImportTemplate.columnsMap).forEach((columnName) => {
            data.columns[columnName] = itemData.columns[columnName];
        });

        const ind = this.templates.create(data);
        const item = this.templates.getItemByIndex(ind);

        return this.returnState(params.returnState, { id: item.id });
    }

    createTemplateFromRequest(params) {
        return this.createTemplate(this.templateFromRequest(params));
    }

    getUpdateTemplateRequest(params) {
        const origItem = this.templates.getItem(params.id) ?? { columns: {} };

        const expTemplate = structuredClone(origItem);
        const data = copyFields(params, ImportTemplate.availProps);
        Object.assign(expTemplate, data);

        const res = structuredClone(expTemplate);
        delete res.columns;

        Object.keys(ImportTemplate.columnsMap).forEach((columnName) => {
            const targetProp = ImportTemplate.columnsMap[columnName];

            if (params[columnName]) {
                expTemplate.columns[targetProp] = params[columnName];
            }

            res[columnName] = expTemplate.columns[targetProp];
        });

        return res;
    }

    updateTemplate(params) {
        const origItem = this.templates.getItem(params.id);
        if (!origItem) {
            return false;
        }

        const expTemplate = structuredClone(origItem);
        const data = copyFields(params, ImportTemplate.availProps);
        Object.assign(expTemplate, data);

        if (params.columns) {
            Object.keys(ImportTemplate.columnsMap).forEach((columnName) => {
                const targetProp = ImportTemplate.columnsMap[columnName];
                if (params.columns && params.columns[targetProp]) {
                    expTemplate.columns[targetProp] = params.columns[targetProp];
                }
            });
        }

        const resExpected = this.validateTemplate(expTemplate);
        if (!resExpected) {
            return false;
        }

        if (!this.templates.update(expTemplate)) {
            return false;
        }

        return this.returnState(params.returnState);
    }

    deleteTemplates(params) {
        const ids = asArray(params?.id);
        if (!ids.length) {
            return false;
        }
        if (!ids.every((id) => this.templates.getItem(id))) {
            return false;
        }

        this.rules.deleteTemplate(ids);
        this.templates.deleteItems(ids);

        return this.returnState(params.returnState);
    }

    /**
     * Import rules
     */
    validateRule(params) {
        if (!checkFields(params, ImportRule.availProps)) {
            return false;
        }

        try {
            const rule = new ImportRule(params);
            const validation = rule.validate();
            return !!validation?.valid;
        } catch (e) {
            return false;
        }
    }

    prepareConditions(conditions) {
        assert.isArray(conditions, 'Invalid conditions parameter');

        return conditions.map((item) => {
            const condition = {
                ...item,
                value: item.value?.toString(),
            };

            if (ImportCondition.isDateField(item.field_id)) {
                const time = dateStringToSeconds(item.value, {
                    locales: this.getDateFormatLocale(),
                    options: App.dateFormatOptions,
                });
                condition.value = time?.toString() ?? null;
            }

            return condition;
        });
    }

    prepareActions(actions) {
        assert.isArray(actions, 'Invalid actions parameter');

        return actions.map((action) => ({
            ...action,
            value: action.value?.toString(),
        }));
    }

    createRule(params) {
        const defaults = {
            flags: 0,
        };
        const itemData = {
            ...defaults,
            ...params,
        };

        const resExpected = this.validateRule(itemData);
        if (!resExpected) {
            return false;
        }

        const data = copyFields(itemData, ImportRule.availProps);
        data.conditions = this.prepareConditions(data.conditions);
        data.actions = this.prepareActions(data.actions);

        const ind = this.rules.create(data);
        const item = this.rules.getItemByIndex(ind);

        return this.returnState(params.returnState, { id: item.id });
    }

    updateRule(params) {
        const origItem = this.rules.getItem(params.id);
        if (!origItem) {
            return false;
        }

        const expRule = origItem.toPlain();
        const data = copyFields(params, ImportRule.availProps);
        Object.assign(expRule, data);

        const resExpected = this.validateRule(expRule);
        if (!resExpected) {
            return false;
        }

        expRule.conditions = this.prepareConditions(expRule.conditions);
        expRule.actions = this.prepareActions(expRule.actions);

        this.rules.update(expRule);

        return this.returnState(params.returnState);
    }

    deleteRules(params) {
        const ids = asArray(params?.id);
        if (!ids.length) {
            return false;
        }
        if (!ids.every((id) => this.rules.getItem(id))) {
            return false;
        }

        this.rules.deleteItems(ids);

        return this.returnState(params.returnState);
    }
}
