import { List } from './List.js';
import { Account } from './Account.js';

/**
 * Accounts list class
 * @param {object[]} props - array of accounts
 */
export class AccountList extends List {
    /** Static alias for AccountList constructor */
    static create(props) {
        return new AccountList(props);
    }

    /**
     * Create list item from specified object
     * @param {Object} obj
     */
    createItem(obj) {
        return new Account(obj);
    }

    /**
     * Return list of Accounts of user
     */
    getUserAccounts(ownerId) {
        const owner = parseInt(ownerId, 10);
        if (!owner) {
            return null;
        }

        return this.filter((item) => item && item.owner_id === ownerId);
    }

    /**
     * Return list of visible Accounts
     */
    getVisible() {
        return this.filter((item) => item && item.isVisible());
    }

    /**
     * Return identifier of another account if possible
     * Return zero account can't be found
     * @param {number} accountId - identifier of account to start looking from
     */
    getNextAccount(accountId) {
        if (!Array.isArray(this.data) || this.length < 2 || !accountId) {
            return 0;
        }

        let pos = this.getItemIndex(accountId);
        if (pos === -1) {
            return 0;
        }

        pos = ((pos === this.length - 1) ? 0 : pos + 1);

        return this.data[pos].id;
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
}
