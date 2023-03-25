import {
    copyObject,
    hasFlag,
    assert,
    asArray,
} from 'jezve-test';
import {
    normalize,
    SORT_BY_CREATEDATE_ASC,
    SORT_BY_CREATEDATE_DESC,
    SORT_BY_NAME_ASC,
    SORT_BY_NAME_DESC,
    SORT_MANUALLY,
} from '../common.js';
import { api } from './api.js';
import { SortableList } from './SortableList.js';
import { App } from '../Application.js';
import { getCurrencyPrecision } from './import.js';
import { __ } from './locale.js';

export const ACCOUNT_HIDDEN = 1;

/** Account types */
export const ACCOUNT_TYPE_OTHER = 0;
export const ACCOUNT_TYPE_CASH = 1;
export const ACCOUNT_TYPE_DEBIT_CARD = 2;
export const ACCOUNT_TYPE_CREDIT_CARD = 3;
export const ACCOUNT_TYPE_CREDIT = 4;
export const ACCOUNT_TYPE_DEPOSIT = 5;

/** Account type names map */
export const accountTypes = {
    [ACCOUNT_TYPE_OTHER]: 'ACCOUNT_TYPE_OTHER',
    [ACCOUNT_TYPE_CASH]: 'ACCOUNT_TYPE_CASH',
    [ACCOUNT_TYPE_DEBIT_CARD]: 'ACCOUNT_TYPE_DEBIT_CARD',
    [ACCOUNT_TYPE_CREDIT_CARD]: 'ACCOUNT_TYPE_CREDIT_CARD',
    [ACCOUNT_TYPE_CREDIT]: 'ACCOUNT_TYPE_CREDIT',
    [ACCOUNT_TYPE_DEPOSIT]: 'ACCOUNT_TYPE_DEPOSIT',
};

/** Returns string for account type name */
export const getAccountTypeName = (value) => {
    const type = parseInt(value, 10);
    assert.isString(accountTypes[type], `Invalid account type: ${value}`);

    return __(accountTypes[type], App.view.locale);
};

export class AccountsList extends SortableList {
    /** Apply transaction to accounts */
    static applyTransaction(accounts, transaction) {
        assert.isArray(accounts, 'Invalid accounts list specified');
        assert(transaction, 'Invalid transaction specified');

        const res = copyObject(accounts);

        const srcAcc = (transaction.src_id)
            ? res.find((item) => item.id === transaction.src_id)
            : null;
        if (srcAcc) {
            const precision = getCurrencyPrecision(srcAcc.curr_id);
            srcAcc.balance = normalize(srcAcc.balance - transaction.src_amount, precision);
        }

        const destAcc = (transaction.dest_id)
            ? res.find((item) => item.id === transaction.dest_id)
            : null;
        if (destAcc) {
            const precision = getCurrencyPrecision(destAcc.curr_id);
            destAcc.balance = normalize(destAcc.balance + transaction.dest_amount, precision);
        }

        return res;
    }

    /** Cancel transaction from accounts */
    static cancelTransaction(accounts, transaction) {
        assert.isArray(accounts, 'Invalid accounts list specified');
        assert(transaction, 'Invalid transaction specified');

        const res = copyObject(accounts);

        const srcAcc = (transaction.src_id)
            ? res.find((item) => item.id === transaction.src_id)
            : null;
        if (srcAcc) {
            const precision = getCurrencyPrecision(srcAcc.curr_id);
            srcAcc.balance = normalize(srcAcc.balance + transaction.src_amount, precision);
        }

        const destAcc = (transaction.dest_id)
            ? res.find((item) => item.id === transaction.dest_id)
            : null;
        if (destAcc) {
            const precision = getCurrencyPrecision(destAcc.curr_id);
            destAcc.balance = normalize(destAcc.balance - transaction.dest_amount, precision);
        }

        return res;
    }

    async fetch() {
        return api.account.list({ owner: 'all' });
    }

    createTransaction(transaction, returnRaw = false) {
        const res = AccountsList.applyTransaction(this.data, transaction);

        if (returnRaw) {
            return res;
        }

        return AccountsList.create(res);
    }

    updateTransaction(origTransaction, newTransaction, returnRaw = false) {
        const afterCancel = AccountsList.cancelTransaction(this.data, origTransaction);
        const res = AccountsList.applyTransaction(afterCancel, newTransaction);

        if (returnRaw) {
            return res;
        }

        return AccountsList.create(res);
    }

    deleteTransactions(transactions, returnRaw = false) {
        const transList = asArray(transactions);

        const res = transList.reduce((data, transaction) => (
            AccountsList.cancelTransaction(data, transaction)
        ), copyObject(this.data));

        if (returnRaw) {
            return res;
        }

        return AccountsList.create(res);
    }

    /** Reset initial balances of all accounts to current values */
    toCurrent(returnRaw = false) {
        const res = this.data.map((account) => ({
            ...account,
            initbalance: account.balance,
        }));

        if (returnRaw) {
            return res;
        }

        return AccountsList.create(res);
    }

    /** Reset balance of all accounts to initial values */
    toInitial(returnRaw = false) {
        const res = this.data.map((account) => ({
            ...account,
            balance: account.initbalance,
        }));

        if (returnRaw) {
            return res;
        }

        return AccountsList.create(res);
    }

    findByName(name, caseSens = false) {
        let lookupName;

        if (caseSens) {
            lookupName = name;
            return this.find((item) => item.name === lookupName);
        }

        lookupName = name.toLowerCase();
        return this.find((item) => item.name.toLowerCase() === lookupName);
    }

    sortByVisibility() {
        this.data.sort((a, b) => a.flags - b.flags);
    }

    getUserAccounts(returnRaw = false) {
        const res = this.filter((item) => item.owner_id === App.owner_id);

        if (returnRaw) {
            return copyObject(res);
        }

        return AccountsList.create(res);
    }

    getPersonsAccounts(returnRaw = false) {
        const res = this.filter((item) => item.owner_id !== App.owner_id);

        if (returnRaw) {
            return copyObject(res);
        }

        return AccountsList.create(res);
    }

    isHidden(account) {
        assert(account, 'Invalid account');

        return hasFlag(account.flags, ACCOUNT_HIDDEN);
    }

    getVisible(returnRaw = false) {
        const res = this.filter((item) => !this.isHidden(item));

        if (returnRaw) {
            return copyObject(res);
        }

        return AccountsList.create(res);
    }

    getHidden(returnRaw = false) {
        const res = this.filter((item) => this.isHidden(item));

        if (returnRaw) {
            return copyObject(res);
        }

        return AccountsList.create(res);
    }

    /** Return visible user accounts */
    getUserVisible(returnRaw = false) {
        return this.getUserAccounts().getVisible(returnRaw);
    }

    /** Return hidden user accounts */
    getUserHidden(returnRaw = false) {
        return this.getUserAccounts().getHidden(returnRaw);
    }

    sortBy(sortMode) {
        if (sortMode === SORT_BY_CREATEDATE_ASC) {
            this.sortByCreateDateAsc();
        } else if (sortMode === SORT_BY_CREATEDATE_DESC) {
            this.sortByCreateDateDesc();
        } else if (sortMode === SORT_BY_NAME_ASC) {
            this.sortByNameAsc();
        } else if (sortMode === SORT_BY_NAME_DESC) {
            this.sortByNameDesc();
        } else if (sortMode === SORT_MANUALLY) {
            this.sortByPos();
        }
    }

    sortByPos() {
        this.data.sort((a, b) => a.pos - b.pos);
    }

    sortByNameAsc() {
        this.data.sort((a, b) => ((a.name > b.name) ? 1 : -1));
    }

    sortByNameDesc() {
        this.data.sort((a, b) => ((a.name < b.name) ? 1 : -1));
    }

    sortByCreateDateAsc() {
        this.data.sort((a, b) => a.id - b.id);
    }

    sortByCreateDateDesc() {
        this.data.sort((a, b) => b.id - a.id);
    }
}
