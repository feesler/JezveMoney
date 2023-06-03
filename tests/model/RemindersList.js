import { asArray, assert } from 'jezve-test';
import { List } from './List.js';
import { REMINDER_SCHEDULED, Reminder } from './Reminder.js';
import { App } from '../Application.js';

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
        const stateFilter = options?.state ?? null;
        const dateFilter = options?.date ?? null;
        const trFilter = options?.transaction_id ?? null;

        if (
            scheduleFilter === null
            && stateFilter === null
            && dateFilter === null
            && trFilter === null
        ) {
            return list;
        }

        return list.filter((item) => (
            (scheduleFilter === null || item.schedule_id === scheduleFilter)
            && (stateFilter === null || item.state === stateFilter)
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

    getExpectedPages(list, limit) {
        const onPage = (typeof limit !== 'undefined') ? limit : App.config.transactionsOnPage;

        return Math.max(Math.ceil(list.length / onPage), 1);
    }

    expectedPages(limit) {
        return this.getExpectedPages(this.data, limit);
    }

    getItemsPage(list, num, limit, range, desc = false) {
        const onPage = (typeof limit !== 'undefined') ? limit : App.config.transactionsOnPage;
        const pagesRange = (typeof range !== 'undefined') ? range : 1;

        const totalPages = this.getExpectedPages(list, onPage);
        assert(num >= 1 && num <= totalPages, `Invalid page number: ${num}`);

        const offset = (num - 1) * onPage;

        const res = this.sortItems(list, desc);

        return res.slice(offset, Math.min(offset + onPage * pagesRange, res.length));
    }

    getPage(num, limit, range, desc = false) {
        const items = this.getItemsPage(this.data, num, limit, range, desc);
        if (items === this.data) {
            return this;
        }

        return RemindersList.create(items);
    }

    sortItems(list, desc = false) {
        assert.isArray(list, 'Invalid list specified');

        const res = structuredClone(list);

        if (desc) {
            return res.sort((a, b) => b.date - a.date);
        }

        return res.sort((a, b) => a.date - b.date);
    }

    sort() {
        this.data = this.sortItems(this.data, true);
    }

    sortAsc() {
        return this.sortItems(this.data);
    }

    sortDesc() {
        return this.sortItems(this.data, true);
    }

    deleteTransactions(transactions) {
        const ids = asArray(transactions);

        this.data = this.data.map((item) => (
            (ids.includes(item.transaction_id))
                ? Reminder.create({
                    ...item,
                    state: REMINDER_SCHEDULED,
                    transaction_id: 0,
                })
                : item
        ));
    }
}
