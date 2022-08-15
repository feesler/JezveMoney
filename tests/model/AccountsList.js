import { copyObject, hasFlag, assert } from 'jezve-test';
import { normalize } from '../common.js';
import { api } from './api.js';
import { List } from './List.js';
import { App } from '../Application.js';

export const ACCOUNT_HIDDEN = 1;

export class AccountsList extends List {
    async fetch() {
        return api.account.list(true);
    }

    clone() {
        const res = new AccountsList(this.data);
        res.autoincrement = this.autoincrement;

        return res;
    }

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

    createTransaction(transaction, returnRaw = false) {
        const res = AccountsList.applyTransaction(this.data, transaction);

        if (returnRaw) {
            return res;
        }

        return new AccountsList(res);
    }

    updateTransaction(origTransaction, newTransaction, returnRaw = false) {
        const afterCancel = AccountsList.cancelTransaction(this.data, origTransaction);
        const res = AccountsList.applyTransaction(afterCancel, newTransaction);

        if (returnRaw) {
            return res;
        }

        return new AccountsList(res);
    }

    deleteTransactions(transactions, returnRaw = false) {
        const transList = Array.isArray(transactions) ? transactions : [transactions];
        let res = copyObject(this.data);

        for (const transaction of transList) {
            res = AccountsList.cancelTransaction(res, transaction);
        }

        if (returnRaw) {
            return res;
        }

        return new AccountsList(res);
    }

    /** Reset initial balances of all accounts to current values */
    toCurrent(returnRaw = false) {
        const res = copyObject(this.data);
        for (const acc of res) {
            acc.initbalance = acc.balance;
        }

        if (returnRaw) {
            return res;
        }

        return new AccountsList(res);
    }

    /** Reset balance of all accounts to initial values */
    toInitial(returnRaw = false) {
        const res = copyObject(this.data);
        for (const acc of res) {
            acc.balance = acc.initbalance;
        }

        if (returnRaw) {
            return res;
        }

        return new AccountsList(res);
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

        return new AccountsList(res);
    }

    getPersonsAccounts(returnRaw = false) {
        const res = this.filter((item) => item.owner_id !== App.owner_id);

        if (returnRaw) {
            return copyObject(res);
        }

        return new AccountsList(res);
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

        return new AccountsList(res);
    }

    getHidden(returnRaw = false) {
        const res = this.filter((item) => this.isHidden(item));

        if (returnRaw) {
            return copyObject(res);
        }

        return new AccountsList(res);
    }

    /** Return visible user accounts */
    getUserVisible(returnRaw = false) {
        return this.getUserAccounts().getVisible(returnRaw);
    }

    /** Return hidden user accounts */
    getUserHidden(returnRaw = false) {
        return this.getUserAccounts().getHidden(returnRaw);
    }

    /**
     * Return another user account id if possible
     * Return first account if no id specified
     * Return zero if no account found
     * @param {number} accountId - identifier of account
     */
    getNext(accountId = 0) {
        const userAccounts = this.getUserAccounts();
        if (!userAccounts || !userAccounts.length) {
            return 0;
        }

        if (!accountId) {
            return userAccounts.indexToId(0);
        }

        if (userAccounts.length < 2) {
            return 0;
        }
        let ind = userAccounts.getIndexById(accountId);
        if (ind === -1) {
            return 0;
        }

        ind = (ind === userAccounts.length - 1) ? 0 : ind + 1;

        return userAccounts.indexToId(ind);
    }
}
