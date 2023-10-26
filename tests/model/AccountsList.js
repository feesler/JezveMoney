import { assert } from '@jezvejs/assert';
import { asArray } from '@jezvejs/types';
import { hasFlag } from 'jezvejs';
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
import { LIMIT_CHANGE } from './Transaction.js';

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
    [ACCOUNT_TYPE_OTHER]: 'accounts.types.other',
    [ACCOUNT_TYPE_CASH]: 'accounts.types.cash',
    [ACCOUNT_TYPE_DEBIT_CARD]: 'accounts.types.debitCard',
    [ACCOUNT_TYPE_CREDIT_CARD]: 'accounts.types.creditCard',
    [ACCOUNT_TYPE_CREDIT]: 'accounts.types.credit',
    [ACCOUNT_TYPE_DEPOSIT]: 'accounts.types.deposit',
};

/** Returns string for account type name */
export const getAccountTypeName = (value) => {
    const type = parseInt(value, 10);
    assert.isString(accountTypes[type], `Invalid account type: ${value}`);

    return __(accountTypes[type]);
};

export class AccountsList extends SortableList {
    /** Apply transaction to accounts */
    static applyTransaction(accounts, transaction) {
        assert.isArray(accounts, 'Invalid accounts list specified');
        assert(transaction, 'Invalid transaction specified');

        const res = structuredClone(accounts);

        const srcAcc = (transaction.src_id)
            ? res.find((item) => item.id === transaction.src_id)
            : null;
        if (srcAcc) {
            const precision = getCurrencyPrecision(srcAcc.curr_id);
            srcAcc.balance = normalize(srcAcc.balance - transaction.src_amount, precision);

            if (srcAcc.type === ACCOUNT_TYPE_CREDIT_CARD && transaction.type === LIMIT_CHANGE) {
                srcAcc.limit = normalize(srcAcc.limit - transaction.src_amount, precision);
            }
        }

        const destAcc = (transaction.dest_id)
            ? res.find((item) => item.id === transaction.dest_id)
            : null;
        if (destAcc) {
            const precision = getCurrencyPrecision(destAcc.curr_id);
            destAcc.balance = normalize(destAcc.balance + transaction.dest_amount, precision);

            if (destAcc.type === ACCOUNT_TYPE_CREDIT_CARD && transaction.type === LIMIT_CHANGE) {
                destAcc.limit = normalize(destAcc.limit + transaction.dest_amount, precision);
            }
        }

        return AccountsList.create(res);
    }

    /** Cancel transaction from accounts */
    static cancelTransaction(accounts, transaction) {
        assert.isArray(accounts, 'Invalid accounts list specified');
        assert(transaction, 'Invalid transaction specified');

        const res = structuredClone(accounts);

        const srcAcc = (transaction.src_id)
            ? res.find((item) => item.id === transaction.src_id)
            : null;
        if (srcAcc) {
            const precision = getCurrencyPrecision(srcAcc.curr_id);
            srcAcc.balance = normalize(srcAcc.balance + transaction.src_amount, precision);

            if (srcAcc.type === ACCOUNT_TYPE_CREDIT_CARD && transaction.type === LIMIT_CHANGE) {
                srcAcc.limit = normalize(srcAcc.limit + transaction.src_amount, precision);
            }
        }

        const destAcc = (transaction.dest_id)
            ? res.find((item) => item.id === transaction.dest_id)
            : null;
        if (destAcc) {
            const precision = getCurrencyPrecision(destAcc.curr_id);
            destAcc.balance = normalize(destAcc.balance - transaction.dest_amount, precision);

            if (destAcc.type === ACCOUNT_TYPE_CREDIT_CARD && transaction.type === LIMIT_CHANGE) {
                destAcc.limit = normalize(destAcc.limit - transaction.dest_amount, precision);
            }
        }

        return AccountsList.create(res);
    }

    async fetch() {
        return api.account.list({ owner: 'all' });
    }

    createTransaction(transaction) {
        const res = AccountsList.applyTransaction(this, transaction);
        return AccountsList.create(res);
    }

    updateTransaction(origTransaction, newTransaction) {
        const afterCancel = AccountsList.cancelTransaction(this, origTransaction);
        const res = AccountsList.applyTransaction(afterCancel, newTransaction);

        return AccountsList.create(res);
    }

    deleteTransactions(transactions) {
        const transList = asArray(transactions);

        const res = transList.reduce((data, transaction) => (
            AccountsList.cancelTransaction(data, transaction)
        ), structuredClone(this));

        return AccountsList.create(res);
    }

    /** Reset initial balances of all accounts to current values */
    toCurrent() {
        const res = this.map((account) => ({
            ...account,
            initbalance: account.balance,
        }));

        return AccountsList.create(res);
    }

    /** Reset balance of all accounts to initial values */
    toInitial() {
        const res = this.map((account) => ({
            ...account,
            balance: account.initbalance,
        }));

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
        this.sort((a, b) => a.flags - b.flags);
    }

    getUserAccounts() {
        const res = this.filter((item) => item.owner_id === App.owner_id);

        return AccountsList.create(res);
    }

    getPersonsAccounts() {
        const res = this.filter((item) => item.owner_id !== App.owner_id);

        return AccountsList.create(res);
    }

    isHidden(account) {
        assert(account, 'Invalid account');

        return hasFlag(account.flags, ACCOUNT_HIDDEN);
    }

    getVisible() {
        const res = this.filter((item) => !this.isHidden(item));

        return AccountsList.create(res);
    }

    getHidden() {
        const res = this.filter((item) => this.isHidden(item));

        return AccountsList.create(res);
    }

    /** Return visible user accounts */
    getUserVisible() {
        return this.getUserAccounts().getVisible();
    }

    /** Return hidden user accounts */
    getUserHidden() {
        return this.getUserAccounts().getHidden();
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
        this.sort((a, b) => a.pos - b.pos);
    }

    sortByNameAsc() {
        this.sort((a, b) => ((a.name > b.name) ? 1 : -1));
    }

    sortByNameDesc() {
        this.sort((a, b) => ((a.name < b.name) ? 1 : -1));
    }

    sortByCreateDateAsc() {
        this.sort((a, b) => a.id - b.id);
    }

    sortByCreateDateDesc() {
        this.sort((a, b) => b.id - a.id);
    }
}
