import { assert } from 'jezve-test';
import { List } from './List.js';
import { ScheduledTransaction } from './ScheduledTransaction.js';
import { TransactionsList } from './TransactionsList.js';
import { App } from '../Application.js';
import { cutDate, timeToSeconds } from '../common.js';
import { REMINDER_UPCOMING } from './Reminder.js';
import { RemindersList } from './RemindersList.js';

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

    getExpectedPages(list, limit) {
        const onPage = (typeof limit !== 'undefined') ? limit : App.config.transactionsOnPage;

        return Math.max(Math.ceil(list.length / onPage), 1);
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

        return ScheduledTransactionsList.create(items);
    }

    sortItems(list, desc = false) {
        assert.isArray(list, 'Invalid list specified');

        const res = structuredClone(list);

        if (desc) {
            return res.sort((a, b) => b.pos - a.pos);
        }

        return res.sort((a, b) => a.pos - b.pos);
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

    getUpcomingReminders(options = {}, reminders = null) {
        const { tomorrow, yearAfter } = App.dates;
        const reminderOptions = {
            startDate: tomorrow,
            endDate: yearAfter,
            ...options,
        };

        reminderOptions.startDate = Math.max(cutDate(options.startDate), tomorrow);
        reminderOptions.endDate = Math.max(cutDate(options.endDate), yearAfter);

        const res = [];
        this.forEach((item) => {
            const reminderDates = item.getReminders(reminderOptions);

            reminderDates.forEach((timestamp) => {
                const reminder = {
                    schedule_id: item.id,
                    state: REMINDER_UPCOMING,
                    date: timeToSeconds(timestamp),
                    transaction_id: 0,
                };

                if (!reminders?.isSameItemExist(reminder)) {
                    res.push(reminder);
                }
            });
        });

        const list = RemindersList.create(res);
        list.sort(false);

        return list;
    }
}
