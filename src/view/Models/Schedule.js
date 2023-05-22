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
}
