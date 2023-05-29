import { List } from './List.js';
import { Reminder } from './Reminder.js';

/**
 * Scheduled transaction reminders list class
 */
export class ReminderList extends List {
    /**
     * Creates list item from specified object
     * @param {Object} obj
     */
    createItem(obj) {
        return new Reminder(obj);
    }
}
