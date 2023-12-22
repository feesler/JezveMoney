import { List } from './List.js';
import { ScheduledTransaction } from './ScheduledTransaction.js';

/**
 * @constructor Schedule class
 * @param {object[]} props - array of scheduled transactions
 */
export class Schedule extends List {
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
