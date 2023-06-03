import { List } from './List.js';
import { Reminder } from './Reminder.js';

/**
 * Scheduled transaction reminders list class
 */
export class ReminderList extends List {
    /**
     * Assign new data to the list
     * @param {Array} data - array of list items
     */
    setData(data) {
        super.setData(data);

        this.sortByDateDesc();
    }

    /**
     * Creates list item from specified object
     * @param {Object} obj
     */
    createItem(obj) {
        return new Reminder(obj);
    }

    sortByDateAsc() {
        this.sort((a, b) => a.date - b.date);
    }

    sortByDateDesc() {
        this.sort((a, b) => b.date - a.date);
    }
}
