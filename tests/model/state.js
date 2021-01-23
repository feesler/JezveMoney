import {
    isValidValue,
    isObject,
    isInt,
    copyObject,
    setParam,
    checkObjValue,
} from '../common.js';
import {
    EXPENSE,
    INCOME,
    DEBT,
    availTransTypes,
    TRANSFER,
} from './transaction.js';
import { App } from '../app.js';
import { List } from './list.js';
import { Currency } from './currency.js';
import { Icon } from './icon.js';
import { ImportRule } from './importrule.js';
import { ACCOUNT_HIDDEN, AccountsList } from './accountslist.js';
import { PERSON_HIDDEN, PersonsList } from './personslist.js';
import { TransactionsList } from './transactionslist.js';
import { ImportCondition } from './importcondition.js';
import { ImportAction } from './importaction.js';
import { api } from './api.js';

/* eslint-disable no-bitwise */

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
const tplReqFields = ['name', 'type_id', 'columns'];
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

    for (const f of expFields) {
        if (!(f in fields)) {
            return false;
        }
    }

    return true;
}

/**
 * Return new object with properties of specified object which are presents in expected object
 * @param {Object} fields - object to check
 * @param {Object} expFields - expected object
 */
function copyFields(fields, expFields) {
    const res = {};

    if (!fields || !expFields) {
        throw new Error('Invalid parameters');
    }

    for (const f of expFields) {
        if (f in fields) {
            res[f] = fields[f];
        }
    }

    return res;
}

export class AppState {
    constructor() {
        this.accounts = null;
        this.persons = null;
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
        this.accounts.data = copyObject(state.accounts.data);
        this.accounts.autoincrement = state.accounts.autoincrement;

        if (!this.persons) {
            this.persons = new PersonsList();
        }
        this.persons.data = copyObject(state.persons.data);
        this.persons.autoincrement = state.persons.autoincrement;

        if (!this.transactions) {
            this.transactions = new TransactionsList();
        }
        this.transactions.data = copyObject(state.transactions.data);
        this.transactions.sort();
        this.transactions.autoincrement = state.transactions.autoincrement;

        if (!this.templates) {
            this.templates = new List();
        }
        this.templates.data = copyObject(state.templates.data);
        this.templates.autoincrement = state.templates.autoincrement;

        if (!this.rules) {
            this.rules = new List();
        }
        this.rules.data = copyObject(state.rules.data);
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
        const res = checkObjValue(this.accounts.data, expected.accounts.data)
            && checkObjValue(this.transactions.data, expected.transactions.data)
            && checkObjValue(this.persons.data, expected.persons.data)
            && checkObjValue(this.templates.data, expected.templates.data)
            && checkObjValue(this.rules.data, expected.rules.data)
            && checkObjValue(this.profile, expected.profile);
        return res;
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

    resetAll() {
        if (this.accounts) {
            this.accounts.reset();
        }
        if (this.persons) {
            this.persons.reset();
        }
        if (this.transactions) {
            this.transactions.reset();
        }
        if (this.templates) {
            this.templates.reset();
        }
        if (this.rules) {
            this.rules.reset();
        }
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

        const currObj = Currency.getById(params.curr_id);
        if (!currObj) {
            return false;
        }

        if (params.icon_id && !Icon.getItem(params.icon_id)) {
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
        setParam(expAccount, data);

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

        this.rulesDeleteAccounts(itemIds);
        this.transactions = this.transactions.deleteAccounts(this.accounts.data, itemIds);

        // Prepare expected updates of accounts list
        this.accounts.deleteItems(ids);

        this.transactions.updateResults(this.accounts);
        this.updatePersonAccounts();

        return true;
    }

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

    resetAccounts() {
        this.accounts.data = [];
        this.transactions.data = [];

        return true;
    }

    getAccountByIndex(ind, visibleAccList, hiddenAccList) {
        const index = parseInt(ind, 10);
        if (Number.isNaN(index)
            || index < 0
            || index > visibleAccList.length + hiddenAccList.length) {
            throw new Error(`Invalid account index ${ind}`);
        }

        if (index < visibleAccList.length) {
            return visibleAccList[index].id;
        }

        const hiddenInd = index - visibleAccList.length;
        return hiddenAccList[hiddenInd].id;
    }

    getAccountsByIndexes(accounts) {
        const itemIndexes = Array.isArray(accounts) ? accounts : [accounts];

        const userAccList = this.accounts.getUserAccounts();
        const visibleAccList = userAccList.getVisible(true);
        const hiddenAccList = userAccList.getHidden(true);

        return itemIndexes.map((ind) => this.getAccountByIndex(
            ind,
            visibleAccList,
            hiddenAccList,
        ));
    }

    getAccountIndexesByNames(accounts) {
        const accNames = Array.isArray(accounts) ? accounts : [accounts];
        const userAccounts = this.accounts.getUserAccounts().getVisible();

        return accNames.map((name) => {
            const acc = userAccounts.findByName(name);
            if (!acc) {
                throw new Error(`Account '${name}' not found`);
            }

            return userAccounts.getIndexOf(acc.id);
        });
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
        setParam(expPerson, data);

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

        this.rulesDeletePersons(ids);
        this.persons.deleteItems(ids);

        // Prepare expected updates of transactions
        this.transactions = this.transactions.deleteAccounts(this.accounts.data, accountsToDelete);
        this.accounts.deleteItems(accountsToDelete);
        this.transactions.updateResults(this.accounts);

        return true;
    }

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

    getPersonAccount(personId, currencyId) {
        const pId = parseInt(personId, 10);
        const currId = parseInt(currencyId, 10);
        if (!pId || !currId) {
            return null;
        }

        const accObj = this.accounts.data.find(
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

    getPersonByIndex(ind, visibleList, hiddenList) {
        if (ind < 0 || ind > visibleList.length + hiddenList.length) {
            throw new Error(`Invalid person index ${ind}`);
        }

        if (ind < visibleList.length) {
            return visibleList[ind].id;
        }

        const hiddenInd = ind - visibleList.length;
        return hiddenList[hiddenInd].id;
    }

    getPersonsByIndexes(persons) {
        const itemIndexes = Array.isArray(persons) ? persons : [persons];

        const visibleList = this.persons.getVisible(true);
        const hiddenList = this.persons.getHidden(true);

        return itemIndexes.map((ind) => this.getPersonByIndex(ind, visibleList, hiddenList));
    }

    getPersonIndexesByNames(persons) {
        const names = Array.isArray(persons) ? persons : [persons];
        const visibleList = this.persons.getVisible();

        return names.map((name) => {
            const person = visibleList.findByName(name);
            if (!person) {
                throw new Error(`Person '${name}' not found`);
            }

            return visibleList.getIndexOf(person.id);
        });
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

        if (params.src_amount === 0 || params.dest_amount === 0) {
            return false;
        }

        const srcCurr = Currency.getById(params.src_curr);
        if (!srcCurr) {
            return false;
        }
        const destCurr = Currency.getById(params.dest_curr);
        if (!destCurr) {
            return false;
        }

        if (params.type === DEBT) {
            if (!params.person_id) {
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
                if (!account || srcCurr.id !== account.curr_id) {
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
                if (!account || destCurr.id !== account.curr_id) {
                    return false;
                }
            } else if (params.type === INCOME || params.type === TRANSFER) {
                return false;
            }
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
            person.accounts = this.accounts.data.filter((item) => item.owner_id === person.id)
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
        setParam(updTrans, params);

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

        if (typeof params.name !== 'string' || params.name === '') {
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
        setParam(expTemplate, data);

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

    createRule(params) {
        const resExpected = this.checkRuleCorrectness(params);
        if (!resExpected) {
            return false;
        }

        const data = copyFields(params, ruleReqFields);

        const ind = this.rules.create(data);
        const item = this.rules.getItemByIndex(ind);

        return item.id;
    }

    updateRule(params) {
        const origItem = this.rules.getItem(params.id);
        if (!origItem) {
            return false;
        }

        const expRule = copyObject(origItem);
        const data = copyFields(params, ruleReqFields);
        setParam(expRule, data);

        const resExpected = this.checkRuleCorrectness(expRule);
        if (!resExpected) {
            return false;
        }

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

    deleteEmptyRules() {
        this.rules.data = this.rules.data.filter(
            (rule) => (rule.conditions.length > 0 && rule.actions.length > 0),
        );
    }

    rulesDeleteAccounts(ids) {
        let itemIds = Array.isArray(ids) ? ids : [ids];
        if (!itemIds.length) {
            return;
        }

        itemIds = itemIds.map((id) => parseInt(id, 10));
        this.rules.data = this.rules.data.map((rule) => {
            const res = rule;

            res.conditions = res.conditions.filter(
                (condition) => {
                    if (!ImportCondition.isAccountField(condition.field_id)
                        || ImportCondition.isPropertyValueFlag(condition.flags)) {
                        return true;
                    }

                    const accountId = parseInt(condition.value, 10);
                    return !itemIds.includes(accountId);
                },
            );

            res.actions = res.actions.filter(
                (action) => {
                    if (!ImportAction.isAccountValue(action.action_id)) {
                        return true;
                    }

                    const accountId = parseInt(action.value, 10);
                    return !itemIds.includes(accountId);
                },
            );

            return res;
        });

        this.deleteEmptyRules();
    }

    rulesDeletePersons(ids) {
        let itemIds = Array.isArray(ids) ? ids : [ids];
        if (!itemIds.length) {
            return;
        }

        itemIds = itemIds.map((id) => parseInt(id, 10));
        this.rules.data = this.rules.data.map((rule) => {
            const res = rule;

            res.conditions = res.conditions.filter(
                (condition) => {
                    if (!ImportCondition.isTemplateField(condition.field_id)
                        || ImportCondition.isPropertyValueFlag(condition.flags)) {
                        return true;
                    }

                    const templateId = parseInt(condition.value, 10);
                    return !itemIds.includes(templateId);
                },
            );

            return res;
        });

        this.deleteEmptyRules();
    }

    rulesDeleteTemplate(ids) {
        let itemIds = Array.isArray(ids) ? ids : [ids];
        if (!itemIds.length) {
            return;
        }

        itemIds = itemIds.map((id) => parseInt(id, 10));
        this.rules.data = this.rules.data.map((rule) => {
            const res = rule;

            res.actions = res.actions.filter(
                (action) => {
                    if (!ImportAction.isPersonValue(action.action_id)) {
                        return true;
                    }

                    const personId = parseInt(action.value, 10);
                    return !itemIds.includes(personId);
                },
            );

            return res;
        });

        this.deleteEmptyRules();
    }
}
