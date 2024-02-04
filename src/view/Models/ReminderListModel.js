import { ListModel } from './ListModel.js';
import { Reminder } from './Reminder.js';

/**
 * Scheduled transaction reminders list class
 */
export class ReminderListModel extends ListModel {
    /**
     * Creates list item from specified object
     * @param {Object} obj
     */
    createItem(obj) {
        return new Reminder(obj);
    }

    defaultSort(desc = true) {
        if (desc) {
            this.sortByDateDesc();
        } else {
            this.sortByDateAsc();
        }
    }

    sortByDateAsc() {
        this.sort((a, b) => (
            (a.date === b.date)
                ? (a.schedule_id - b.schedule_id)
                : (a.date - b.date)
        ));
    }

    sortByDateDesc() {
        this.sort((a, b) => (
            (a.date === b.date)
                ? (b.schedule_id - a.schedule_id)
                : (b.date - a.date)
        ));
    }
}
