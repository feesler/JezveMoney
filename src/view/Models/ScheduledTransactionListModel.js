import { ListModel } from './ListModel.js';
import { ScheduledTransaction } from './ScheduledTransaction.js';

/**
 * @constructor ScheduledTransactionListModel class
 * @param {object[]} props - array of scheduled transactions
 */
export class ScheduledTransactionListModel extends ListModel {
    /**
     * Creates list item from specified object
     * @param {Object} obj
     */
    createItem(obj) {
        return new ScheduledTransaction(obj);
    }

    /** Search scheduled transaction with specified name */
    findByName(name, caseSens = false) {
        if (typeof name !== 'string' || name.length === 0) {
            return null;
        }

        const lookupName = (caseSens) ? name : name.toLowerCase();
        return this.find((item) => (
            (caseSens)
                ? (item.name === lookupName)
                : (item.name.toLowerCase() === lookupName)
        ));
    }
}
