import { asArray } from 'jezve-test';
import { List } from './List.js';
import { Reminder } from './Reminder.js';

/** List of scheduled transaction reminders */
export class RemindersList extends List {
    /**
     * Filters list of reminders and returns result
     * @param {Array} list array of Reminder objects
     * @param {Object} options filter object
     * @returns
     */
    static filterItems(list, options = {}) {
        const scheduleFilter = options?.schedule_id ?? null;
        const dateFilter = options?.date ?? null;
        const trFilter = options?.transaction_id ?? null;

        if (
            scheduleFilter === null
            && dateFilter === null
            && trFilter === null
        ) {
            return list;
        }

        return list.filter((item) => (
            (scheduleFilter === null || item.schedule_id === scheduleFilter)
            && (dateFilter === null || item.date === dateFilter)
            && (trFilter === null || item.transaction_id === trFilter)
        ));
    }

    /**
     * Create list item from specified object
     * @param {Object} obj
     */
    createItem(obj) {
        return new Reminder(obj);
    }

    /**
     * Returns reminder confirmed with specified transactions
     * @param {Number} transactionId transaction id
     */
    getReminderByTransaction(transactionId) {
        const id = parseInt(transactionId, 10);
        return this.data.find((item) => item.transaction_id === id);
    }

    /**
     * Returns reminders of specified scheduled transactions
     * @param {Number} scheduleId scheduled transaction id
     * @param {boolean} returnIds return ids instead of reminder objects
     */
    getRemindersBySchedule(scheduleId, returnIds = false) {
        const id = parseInt(scheduleId, 10);
        const res = this.data.filter((item) => item.schedule_id === id);
        return (returnIds) ? res.map((item) => item.id) : res;
    }

    /**
     * Returns reminders for specified date
     * @param {Number} timestamp
     * @param {boolean} returnIds return ids instead of reminder objects
     */
    getReminderByDate(timestamp, returnIds = false) {
        const date = parseInt(timestamp, 10);
        const res = this.data.filter((item) => item.date === date);
        return (returnIds) ? res.map((item) => item.id) : res;
    }

    /**
     * Removes all reminders of specified scheduled transactions
     * @param {Number} scheduleId scheduled transaction id or array of ids
     */
    deleteRemindersBySchedule(scheduleId) {
        const ids = asArray(scheduleId).map((id) => parseInt(id, 10));
        this.data = this.data.filter((item) => !ids.includes(item.schedule_id));
    }

    /**
     * Filters list of reminders and returns result
     * @param {Object} params
     * @returns RemindersList
     */
    applyFilter(params) {
        const items = RemindersList.filterItems(this.data, params);
        if (items === this.data) {
            return this;
        }

        return RemindersList.create(items);
    }
}
