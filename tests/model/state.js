import {
    isValidValue,
    isObject,
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
import { Currency } from './currency.js';
import { Icon } from './icon.js';
import { ACCOUNT_HIDDEN, AccountsList } from './accountslist.js';
import { PERSON_HIDDEN, PersonsList } from './personslist.js';
import { TransactionsList } from './transactionslist.js';
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
        res.profile = copyObject(this.profile);

        return res;
    }

    meetExpectation(expected) {
        const res = checkObjValue(this.accounts.data, expected.accounts.data)
            && checkObjValue(this.transactions.data, expected.transactions.data)
            && checkObjValue(this.persons.data, expected.persons.data)
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
        const itemIds = Array.isArray(ids) ? ids : [ids];
        if (!itemIds.length) {
            return false;
        }

        for (const accountId of itemIds) {
            if (!this.accounts.getItem(accountId)) {
                return false;
            }
        }

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
        if (ind < 0 || ind > visibleAccList.length + hiddenAccList.length) {
            throw new Error(`Invalid account index ${ind}`);
        }

        if (ind < visibleAccList.length) {
            return visibleAccList[ind].id;
        }

        const hiddenInd = ind - visibleAccList.length;
        return hiddenAccList[hiddenInd].id;
    }

    getAccountsByIndexes(accounts) {
        const itemIndexes = Array.isArray(accounts) ? accounts : [accounts];

        const userAccList = App.state.accounts.getUserAccounts();
        const visibleAccList = userAccList.getVisible(true);
        const hiddenAccList = userAccList.getHidden(true);

        return itemIndexes.map((ind) => this.getAccountByIndex(
            ind,
            visibleAccList,
            hiddenAccList,
        ));
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

    // Search for account of person in specified currency
    // In case no such account exist create new account with expected properties
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
}
