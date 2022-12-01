import { copyObject, hasFlag, assert } from 'jezve-test';
import { normalize } from '../common.js';
import { api } from './api.js';
import { List } from './List.js';
import { App } from '../Application.js';

export const ACCOUNT_HIDDEN = 1;

export class AccountsList extends List {
    /** Apply transaction to accounts */
    static applyTransaction(accounts, transaction) {
        assert.isArray(accounts, 'Invalid accounts list specified');
        assert(transaction, 'Invalid transaction specified');

        const res = copyObject(accounts);

        const srcAcc = (transaction.src_id)
            ? res.find((item) => item.id === transaction.src_id)
            : null;
        if (srcAcc) {
            srcAcc.balance = normalize(srcAcc.balance - transaction.src_amount);
        }

        const destAcc = (transaction.dest_id)
            ? res.find((item) => item.id === transaction.dest_id)
            : null;
        if (destAcc) {
            destAcc.balance = normalize(destAcc.balance + transaction.dest_amount);
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
            srcAcc.balance = normalize(srcAcc.balance + transaction.src_amount);
        }

        const destAcc = (transaction.dest_id)
            ? res.find((item) => item.id === transaction.dest_id)
            : null;
        if (destAcc) {
            destAcc.balance = normalize(destAcc.balance - transaction.dest_amount);
        }

        return res;
    }

    async fetch() {
        return api.account.list(true);
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
        const transList = Array.isArray(transactions) ? transactions : [transactions];

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
}
