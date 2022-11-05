import {
    isObject,
    isInt,
    copyObject,
    assert,
} from 'jezve-test';
import {
    checkDate,
    isValidValue,
} from '../common.js';
import {
    EXPENSE,
    INCOME,
    DEBT,
    availTransTypes,
    TRANSFER,
} from './Transaction.js';
import { App } from '../Application.js';
import { List } from './List.js';
import { ImportRule } from './ImportRule.js';
import { ACCOUNT_HIDDEN, AccountsList } from './AccountsList.js';
import { PERSON_HIDDEN, PersonsList } from './PersonsList.js';
import { TransactionsList } from './TransactionsList.js';
import { ImportRuleList } from './ImportRuleList.js';
import { api } from './api.js';

/**
 * Accounts
 */
const accReqFields = ['name', 'balance', 'initbalance', 'curr_id', 'icon_id', 'flags'];

/**
 * Persons
 */
const pReqFields = ['name', 'flags'];

/**
 * Transactions
 */
const trReqFields = ['type', 'src_id', 'dest_id', 'src_amount', 'dest_amount', 'src_curr', 'dest_curr', 'date', 'comment'];

/**
 * Import templates
 */
const tplReqFields = ['name', 'type_id', 'first_row', 'columns'];
const tplReqColumns = ['accountAmount', 'transactionAmount', 'accountCurrency', 'transactionCurrency', 'date', 'comment'];

/**
 * Import rules
 */
const ruleReqFields = ['flags', 'conditions', 'actions'];

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
            res[f] = copyObject(fields[f]);
        }
    });

    return res;
}

export class AppState {
    constructor() {
        this.accounts = null;
        this.userAccountsCache = null;
        this.persons = null;
        this.personsCache = null;
        this.transactions = null;
        this.templates = null;
        this.rules = null;
        this.profile = null;
    }

    async fetch() {
        const newState = await api.state.read();
        this.setState(newState);
    }

    setState(state) {
        if (!this.accounts) {
            this.accounts = new AccountsList();
        }
        this.accounts.setData(state.accounts.data);
        this.accounts.autoincrement = state.accounts.autoincrement;
        this.userAccountsCache = null;

        if (!this.persons) {
            this.persons = new PersonsList();
        }
        this.persons.setData(state.persons.data);
        this.persons.autoincrement = state.persons.autoincrement;
        this.personsCache = null;

        if (!this.transactions) {
            this.transactions = new TransactionsList();
        }
        this.transactions.setData(state.transactions.data);
        this.transactions.autoincrement = state.transactions.autoincrement;

        if (!this.templates) {
            this.templates = new List();
        }
        this.templates.setData(state.templates.data);
        this.templates.autoincrement = state.templates.autoincrement;

        if (!this.rules) {
            this.rules = new ImportRuleList();
        }
        this.rules.setData(state.rules.data);
        this.rules.autoincrement = state.rules.autoincrement;

        this.profile = copyObject(state.profile);
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
        res.transactions = this.transactions.clone();
        res.templates = this.templates.clone();
        res.rules = this.rules.clone();
        res.profile = copyObject(this.profile);

        return res;
    }

    meetExpectation(expected) {
        assert.deepMeet(this.accounts.data, expected.accounts.data);
        assert.deepMeet(this.transactions.data, expected.transactions.data);
        assert.deepMeet(this.persons.data, expected.persons.data);
        assert.deepMeet(this.templates.data, expected.templates.data);
        assert.deepMeet(this.rules.data, expected.rules.data);
        assert.deepMeet(this.profile, expected.profile);

        return true;
    }

    /**
     * Profile
     */
    setUserProfile(profile) {
        this.profile = copyObject(profile);
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

            const ids = accountsToDelete.getIds();
            this.deleteAccounts(ids);
        }

        if (resetPersons) {
            const ids = this.persons?.getIds();
            this.deletePersons(ids);
        }

        if ('transactions' in options) {
            this.transactions?.reset();

            const accountsData = (keepAccountBalance)
                ? this.accounts?.toCurrent(true)
                : this.accounts?.toInitial(true);
            this.accounts?.setData(accountsData);
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
        this.userAccountsCache = null;
        this.persons?.reset();
        this.personsCache = null;
        this.transactions?.reset();
        this.templates?.reset();
        this.rules?.reset();
    }

    changeName(name) {
        this.profile.name = name;
    }

    deleteProfile() {
        this.resetAll();
        delete this.profile;
    }

    /**
     * Accounts
     */

    checkAccountCorrectness(params) {
        if (!isObject(params)) {
            return false;
        }

        if (typeof params.name !== 'string' || params.name === '') {
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

        return true;
    }

    createAccount(params) {
        const resExpected = this.checkAccountCorrectness(params);
        if (!resExpected) {
            return false;
        }

        const data = copyFields(params, accReqFields);
        data.owner_id = this.profile.owner_id;

        const ind = this.accounts.create(data);
        const item = this.accounts.getItemByIndex(ind);
        this.updatePersonAccounts();

        return item.id;
    }

    updateAccount(params) {
        const origAcc = this.accounts.getItem(params.id);
        if (!origAcc) {
            return false;
        }

        // Prepare expected account object
        const expAccount = copyObject(origAcc);
        const data = copyFields(params, accReqFields);
        data.owner_id = this.profile.owner_id;
        Object.assign(expAccount, data);

        const resExpected = this.checkAccountCorrectness(expAccount);
        if (!resExpected) {
            return false;
        }

        const balDiff = expAccount.initbalance - origAcc.initbalance;
        if (balDiff.toFixed(2) !== 0) {
            expAccount.balance = origAcc.balance + balDiff;
        }

        // Prepare expected updates of transactions list
        this.transactions = this.transactions.updateAccount(this.accounts.data, expAccount);

        // Prepare expected updates of accounts list
        this.accounts.update(expAccount);

        this.transactions.updateResults(this.accounts);
        this.updatePersonAccounts();

        return true;
    }

    deleteAccounts(ids) {
        let itemIds = Array.isArray(ids) ? ids : [ids];
        if (!itemIds.length) {
            return false;
        }

        itemIds = itemIds.map((id) => parseInt(id, 10));
        for (const accountId of itemIds) {
            if (!this.accounts.getItem(accountId)) {
                return false;
            }
        }

        this.rules.deleteAccounts(itemIds);
        this.transactions = this.transactions.deleteAccounts(this.accounts.data, itemIds);

        // Prepare expected updates of accounts list
        this.accounts.deleteItems(ids);

        this.transactions.updateResults(this.accounts);
        this.updatePersonAccounts();

        return true;
    }

    /* eslint-disable no-bitwise */
    showAccounts(ids, show = true) {
        const itemIds = Array.isArray(ids) ? ids : [ids];

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

        return true;
    }
    /* eslint-enable no-bitwise */

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

    getAccountsByIndexes(accounts, returnIds = false) {
        const itemIndexes = Array.isArray(accounts) ? accounts : [accounts];
        this.cacheUserAccounts();

        return itemIndexes.map((ind) => {
            const item = this.userAccountsCache.getItemByIndex(ind);
            assert(item, `Invalid account index ${ind}`);
            return (returnIds) ? item.id : item;
        });
    }

    getAccountIndexesByNames(accounts) {
        const accNames = Array.isArray(accounts) ? accounts : [accounts];
        this.cacheUserAccounts();

        return accNames.map((name) => {
            const acc = this.userAccountsCache.findByName(name);
            assert(acc, `Account '${name}' not found`);

            return this.userAccountsCache.getIndexById(acc.id);
        });
    }

    getFirstAccount() {
        const [account] = this.getAccountsByIndexes(0);
        return account;
    }

    /**
     * Persons
     */

    checkPersonCorrectness(params) {
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
        const resExpected = this.checkPersonCorrectness(params);
        if (!resExpected) {
            return false;
        }

        const data = copyFields(params, pReqFields);
        const ind = this.persons.create(data);
        const item = this.persons.getItemByIndex(ind);
        item.accounts = [];

        return item.id;
    }

    updatePerson(params) {
        const origPerson = this.persons.getItem(params.id);
        if (!origPerson) {
            return false;
        }

        const expPerson = copyObject(origPerson);
        const data = copyFields(params, pReqFields);
        Object.assign(expPerson, data);

        const resExpected = this.checkPersonCorrectness(expPerson);
        if (!resExpected) {
            return false;
        }

        this.persons.update(expPerson);

        return true;
    }

    deletePersons(ids) {
        const itemIds = Array.isArray(ids) ? ids : [ids];
        if (!itemIds.length) {
            return false;
        }

        const accountsToDelete = [];
        for (const personId of itemIds) {
            const person = this.persons.getItem(personId);
            if (!person) {
                return false;
            }

            if (Array.isArray(person.accounts)) {
                accountsToDelete.push(...person.accounts.map((item) => item.id));
            }
        }

        this.rules.deletePersons(ids);
        this.persons.deleteItems(ids);

        // Prepare expected updates of transactions
        this.transactions = this.transactions.deleteAccounts(this.accounts.data, accountsToDelete);
        this.accounts.deleteItems(accountsToDelete);
        this.transactions.updateResults(this.accounts);

        return true;
    }

    /* eslint-disable no-bitwise */
    showPersons(ids, show = true) {
        const itemIds = Array.isArray(ids) ? ids : [ids];
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

        return true;
    }
    /* eslint-enable no-bitwise */

    getPersonAccounts(personId) {
        const person = this.persons.getItem(personId);
        if (person && Array.isArray(person.accounts)) {
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

        return copyObject(accObj);
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

    cachePersons() {
        if (this.personsCache) {
            return;
        }

        this.personsCache = this.persons.clone();
        this.personsCache.sortByVisibility();
    }

    getPersonsByIndexes(persons, returnIds = false) {
        const itemIndexes = Array.isArray(persons) ? persons : [persons];
        this.cachePersons();

        return itemIndexes.map((ind) => {
            const item = this.personsCache.getItemByIndex(ind);
            assert(item, `Invalid person index ${ind}`);
            return (returnIds) ? item.id : item;
        });
    }

    getPersonIndexesByNames(persons) {
        const names = Array.isArray(persons) ? persons : [persons];
        this.cachePersons();

        return names.map((name) => {
            const person = this.personsCache.findByName(name);
            assert(person, `Person '${name}' not found`);

            return this.personsCache.getIndexById(person.id);
        });
    }

    getFirstPerson() {
        const [person] = this.getPersonsByIndexes(0);
        return person;
    }

    /**
     * Transactions
     */

    checkTransactionCorrectness(params) {
        if (!isObject(params)) {
            return false;
        }

        if (!availTransTypes.includes(params.type)) {
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

        if (params.type === DEBT) {
            if (!params.person_id) {
                return false;
            }
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
                    || srcCurr.id !== account.curr_id
                    || destCurr.id !== account.curr_id
                ) {
                    return false;
                }
            }
        } else {
            if (params.src_id) {
                if (params.type === INCOME) {
                    return false;
                }

                const account = this.accounts.getItem(params.src_id);
                if (
                    !account
                    || srcCurr.id !== account.curr_id
                    || account.owner_id !== this.profile.owner_id
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
                    || account.owner_id !== this.profile.owner_id
                ) {
                    return false;
                }
            } else if (params.type === INCOME || params.type === TRANSFER) {
                return false;
            }

            if (params.src_id === params.dest_id) {
                return false;
            }
        }

        if ('date' in params && !checkDate(params.date)) {
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

        const res = copyObject(transaction);
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

    getExpectedTransaction(params) {
        const res = copyObject(params);
        if (!res.date) {
            res.date = App.dates.now;
        }
        if (!res.comment) {
            res.comment = '';
        }
        if (res.type !== DEBT) {
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

        // Different currencies not supported yet for debts
        res.src_curr = reqCurr;
        res.dest_curr = reqCurr;

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
        let resExpected = this.checkTransactionCorrectness(params);
        if (!resExpected) {
            return false;
        }

        // Prepare expected transaction object
        const expTrans = this.getExpectedTransaction(params);
        if (!expTrans) {
            return false;
        }
        expTrans.pos = 0;

        resExpected = checkFields(expTrans, trReqFields);
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

        return item.id;
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

        const correct = this.checkTransactionCorrectness(updTrans);
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
        this.transactions.update(expTrans.id, expTrans);
        this.transactions.updateResults(this.accounts);
        this.updatePersonAccounts();

        return true;
    }

    deleteTransactions(ids) {
        const itemIds = Array.isArray(ids) ? ids : [ids];
        if (!itemIds.length) {
            return false;
        }

        const itemsToDelete = [];
        for (const transactionId of ids) {
            const item = this.transactions.getItem(transactionId);
            if (!item) {
                return false;
            }

            itemsToDelete.push(item);
        }

        // Prepare expected updates of transactions list
        this.accounts = this.accounts.deleteTransactions(itemsToDelete);
        this.transactions.deleteItems(itemIds);
        this.transactions.updateResults(this.accounts);
        this.updatePersonAccounts();

        return true;
    }

    setTransactionPos({ id, pos }) {
        if (!parseInt(id, 10) || !parseInt(pos, 10)) {
            return false;
        }

        if (!this.transactions.setPos(id, pos)) {
            return false;
        }

        this.transactions.updateResults(this.accounts);

        return true;
    }

    isAvailableTransactionType(type) {
        assert(availTransTypes.includes(type), 'Invalid transaction type');

        this.cacheUserAccounts();

        if (type === EXPENSE || type === INCOME) {
            return (this.userAccountsCache.length > 0);
        }
        if (type === TRANSFER) {
            return (this.userAccountsCache.length > 1);
        }

        // DEBT
        return (this.persons.length > 0);
    }

    /**
     * Import templates
     */
    checkTemplateCorrectness(params) {
        if (!isObject(params)) {
            return false;
        }

        if (!checkFields(params, tplReqFields)) {
            return false;
        }

        if (typeof params.name !== 'string' || params.name.length === 0) {
            return false;
        }

        if ('account_id' in params) {
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
        return tplReqColumns.every((columnName) => (
            (columnName in params.columns)
            && isInt(params.columns[columnName])
            && params.columns[columnName] > 0
        ));
    }

    createTemplate(params) {
        const resExpected = this.checkTemplateCorrectness(params);
        if (!resExpected) {
            return false;
        }

        const data = copyFields(params, tplReqFields);

        const ind = this.templates.create(data);
        const item = this.templates.getItemByIndex(ind);

        return item.id;
    }

    updateTemplate(params) {
        const origItem = this.templates.getItem(params.id);
        if (!origItem) {
            return false;
        }

        const expTemplate = copyObject(origItem);
        const data = copyFields(params, tplReqFields);
        Object.assign(expTemplate, data);

        const resExpected = this.checkTemplateCorrectness(expTemplate);
        if (!resExpected) {
            return false;
        }

        this.templates.update(expTemplate);

        return true;
    }

    deleteTemplates(ids) {
        const itemIds = Array.isArray(ids) ? ids : [ids];
        if (!itemIds.length) {
            return false;
        }

        for (const itemId of itemIds) {
            if (!this.templates.getItem(itemId)) {
                return false;
            }
        }

        this.rulesDeleteTemplate(ids);
        this.templates.deleteItems(ids);

        return true;
    }

    /**
     * Import rules
     */
    checkRuleCorrectness(params) {
        if (!checkFields(params, ruleReqFields)) {
            return false;
        }

        try {
            const rule = new ImportRule(params);
            return rule.validate();
        } catch (e) {
            return false;
        }
    }

    prepareConditions(conditions) {
        assert.isArray(conditions, 'Invalid conditions parameter');

        return conditions.map((condition) => ({
            ...condition,
            value: ('value' in condition) ? condition.value.toString() : undefined,
        }));
    }

    prepareActions(actions) {
        assert.isArray(actions, 'Invalid actions parameter');

        return actions.map((action) => ({
            ...action,
            value: ('value' in action) ? action.value.toString() : undefined,
        }));
    }

    createRule(params) {
        const resExpected = this.checkRuleCorrectness(params);
        if (!resExpected) {
            return false;
        }

        const data = copyFields(params, ruleReqFields);
        data.conditions = this.prepareConditions(data.conditions);
        data.actions = this.prepareActions(data.actions);

        const ind = this.rules.create(data);
        const item = this.rules.getItemByIndex(ind);

        return item.id;
    }

    updateRule(params) {
        const origItem = this.rules.getItem(params.id);
        if (!origItem) {
            return false;
        }

        const expRule = origItem.toPlain();
        const data = copyFields(params, ruleReqFields);
        Object.assign(expRule, data);

        const resExpected = this.checkRuleCorrectness(expRule);
        if (!resExpected) {
            return false;
        }

        expRule.conditions = this.prepareConditions(expRule.conditions);
        expRule.actions = this.prepareActions(expRule.actions);

        this.rules.update(expRule);

        return true;
    }

    deleteRules(ids) {
        const itemIds = Array.isArray(ids) ? ids : [ids];
        if (!itemIds.length) {
            return false;
        }

        for (const itemId of itemIds) {
            if (!this.rules.getItem(itemId)) {
                return false;
            }
        }

        this.rules.deleteItems(ids);

        return true;
    }
}
