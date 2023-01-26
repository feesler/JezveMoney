import { List } from './List.js';
import { Account } from './Account.js';
import {
    SORT_BY_CREATEDATE_ASC,
    SORT_BY_CREATEDATE_DESC,
    SORT_BY_NAME_ASC,
    SORT_BY_NAME_DESC,
    SORT_MANUALLY,
} from '../utils.js';

/**
 * Accounts list class
 * @param {object[]} props - array of accounts
 */
export class AccountList extends List {
    /**
     * Create list item from specified object
     * @param {Object} obj
     */
    createItem(obj) {
        return new Account(obj);
    }

    /** Return list of Accounts of user */
    getUserAccounts(ownerId) {
        const owner = parseInt(ownerId, 10);
        if (!owner) {
            return null;
        }

        return this.filter((item) => item && item.owner_id === ownerId);
    }

    /** Return list of visible Accounts */
    getVisible() {
        return this.filter((item) => item && item.isVisible());
    }

    /** Return list of hidden Accounts */
    getHidden() {
        return this.filter((item) => item && !item.isVisible());
    }

    /**
     * Returns another account if possible
     * Returns null if account can't be found
     * @param {number} accountId - identifier of account to start looking from
     */
    getNextAccount(accountId = 0) {
        if (!Array.isArray(this.data) || this.length === 0) {
            return null;
        }

        if (accountId === 0) {
            return this.getItemByIndex(0);
        }
        if (this.length < 2) {
            return null;
        }

        let index = this.getItemIndex(accountId);
        if (index === -1) {
            return null;
        }

        index = (index === this.length - 1) ? 0 : index + 1;

        return this.getItemByIndex(index);
    }

    /**
     * Cancel affection of specified transaction from accounts
     * @param {Transaction} transaction - transaction object to cancel affects of
     */
    cancelTransaction(transaction) {
        if (!transaction) {
            return;
        }

        const srcAccount = this.getItem(transaction.src_id);
        if (srcAccount) {
            srcAccount.balance += transaction.src_amount;
        }

        const destAccount = this.getItem(transaction.dest_id);
        if (destAccount) {
            destAccount.balance -= transaction.dest_amount;
        }
    }

    /**
     * Search account of person in specified currency
     * @param {number} personId - person identifier
     * @param {number} currencyId - currency identifier
     */
    getPersonAccount(personId, currencyId) {
        const pId = parseInt(personId, 10);
        const currId = parseInt(currencyId, 10);
        if (!pId || !currId) {
            return null;
        }

        // check person have account in specified currency
        return this.find((item) => item && item.owner_id === pId && item.curr_id === currId);
    }

    /** Search account with specified name */
    findByName(name, caseSens = false) {
        if (typeof name !== 'string' || name.length === 0) {
            return null;
        }

        const lookupName = (caseSens) ? name : name.toLowerCase();
        return this.find((account) => (
            (caseSens)
                ? (account.name === lookupName)
                : (account.name.toLowerCase() === lookupName)
        ));
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
