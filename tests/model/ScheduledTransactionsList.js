import { List } from './List.js';
import { ScheduledTransaction } from './ScheduledTransaction.js';
import { TransactionsList } from './TransactionsList.js';

/** List of scheduled transactions */
export class ScheduledTransactionsList extends List {
    /**
     * Create list item from specified object
     * @param {Object} obj
     */
    createItem(obj) {
        return new ScheduledTransaction(obj);
    }

    /** Returns expected list of scheduled transactions after update specified account */
    updateAccount(accList, account) {
        const res = TransactionsList.onUpdateAccount(this.data, accList, account);

        return ScheduledTransactionsList.create(res);
    }

    /** Returns expected list of scheduled transactions after delete specified accounts */
    deleteAccounts(accList, ids) {
        const res = TransactionsList.onDeleteAccounts(this.data, accList, ids);

        return ScheduledTransactionsList.create(res);
    }

    /** Returns expected list of transactions after delete specified categories */
    deleteCategories(ids) {
        const res = TransactionsList.onDeleteCategories(this.data, ids);

        return ScheduledTransactionsList.create(res);
    }
}
