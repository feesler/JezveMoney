import { assert } from 'jezve-test';
import { List } from './List.js';
import { ScheduledTransaction } from './ScheduledTransaction.js';
import { TransactionsList } from './TransactionsList.js';
import { App } from '../Application.js';
import { timeToSeconds } from '../common.js';
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
        const res = TransactionsList.onUpdateAccount(this, accList, account);

        return ScheduledTransactionsList.create(res);
    }

    /** Returns expected list of scheduled transactions after delete specified accounts */
    deleteAccounts(accList, ids) {
        const res = TransactionsList.onDeleteAccounts(this, accList, ids);

        return ScheduledTransactionsList.create(res);
    }

    /** Returns expected list of transactions after delete specified categories */
    deleteCategories(ids) {
        const res = TransactionsList.onDeleteCategories(this, ids);

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
        const items = this.getItemsPage(this, num, limit, range, desc);
        if (items === this) {
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

    defaultSort() {
        const data = this.sortItems(this, true);
        this.setData(data);
    }

    sortAsc() {
        return this.sortItems(this);
    }

    sortDesc() {
        return this.sortItems(this, true);
    }

    getLongestInterval() {
        let maxDays = 0;
        let res = null;

        this.forEach((item) => {
            const days = item.getIntervalLength();
            if (res === null || maxDays < days) {
                res = item;
                maxDays = days;
            }
        });

        return res;
    }

    getUpcomingReminders(options = {}, reminders = null) {
        const { tomorrow, yearAfter } = App.dates;
        const reminderOptions = {
            startDate: tomorrow,
            endDate: yearAfter,
            ...options,
        };

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
        list.defaultSort(false);

        return list;
    }
}
