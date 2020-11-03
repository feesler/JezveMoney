import { copyObject, normalize } from '../common.js';
import { api } from './api.js';
import { List } from './list.js';
import { App } from '../app.js';

/* eslint-disable no-bitwise */

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
        if (!Array.isArray(accounts)) {
            throw new Error('Invalid accounts list specified');
        }
        if (!transaction) {
            throw new Error('Invalid transaction specified');
        }

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
        if (!Array.isArray(accounts)) {
            throw new Error('Invalid accounts list specified');
        }
        if (!transaction) {
            throw new Error('Invalid transaction specified');
        }

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
            return this.data.find((item) => item.name === lookupName);
        }

        lookupName = name.toLowerCase();
        return this.data.find((item) => item.name.toLowerCase() === lookupName);
    }

    getUserAccounts(returnRaw = false) {
        const res = this.data.filter((item) => item.owner_id === App.owner_id);

        if (returnRaw) {
            return copyObject(res);
        }

        return new AccountsList(res);
    }

    isHidden(account) {
        if (!account) {
            throw new Error('Invalid account');
        }

        return (account.flags & ACCOUNT_HIDDEN) === ACCOUNT_HIDDEN;
    }

    getVisible(returnRaw = false) {
        const res = this.data.filter((item) => !this.isHidden(item));

        if (returnRaw) {
            return copyObject(res);
        }

        return new AccountsList(res);
    }

    getHidden(returnRaw = false) {
        const res = this.data.filter((item) => this.isHidden(item));

        if (returnRaw) {
            return copyObject(res);
        }

        return new AccountsList(res);
    }

    /**
     * Return another visible user account id if possible
     * Return zero if no account found
     * @param {number} accountId - identifier of account
     */
    getNext(accountId) {
        if (!accountId) {
            return 0;
        }

        const userAccounts = this.getUserAccounts();
        if (!userAccounts) {
            return 0;
        }
        const visibleAccounts = userAccounts.getVisible();
        if (!visibleAccounts || visibleAccounts.length < 2) {
            return 0;
        }

        let ind = visibleAccounts.getIndexOf(accountId);
        if (ind === -1) {
            return 0;
        }

        ind = (ind === visibleAccounts.length - 1) ? 0 : ind + 1;

        return visibleAccounts.indexToId(ind);
    }
}
