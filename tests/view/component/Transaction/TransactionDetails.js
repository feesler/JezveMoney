import { assert } from '@jezvejs/assert';
import {
    TestComponent,
    query,
    click,
    evaluate,
} from 'jezve-test';
import { App } from '../../../Application.js';
import { __ } from '../../../model/locale.js';
import { Transaction } from '../../../model/Transaction.js';
import { ReminderField } from '../Fields/ReminderField.js';

const fieldSelectors = {
    sourceField: '.source-field',
    destinationField: '.destination-field',
    srcAmountField: '.src-amount-field',
    destAmountField: '.dest-amount-field',
    srcResultField: '.src-result-field',
    destResultField: '.dest-result-field',
    dateField: '.date-field',
    categoryField: '.category-field',
    commentField: '.comment-field',
    createDateField: '.create-date-field',
    updateDateField: '.update-date-field',
};

export class TransactionDetails extends TestComponent {
    async parseContent() {
        const res = await evaluate((el, selectors) => {
            const textElemState = (elem) => ({
                value: elem?.textContent,
                visible: !!elem && !elem.hidden,
            });

            const state = {
                title: textElemState(el.querySelector('.heading h1')),
            };

            Object.entries(selectors).forEach(([field, selector]) => {
                const elem = el.querySelector(selector);
                const titleEl = elem?.querySelector('.field__title');
                const contentEl = elem?.querySelector('.field__content');
                state[field] = {
                    title: titleEl?.textContent,
                    value: contentEl?.textContent,
                    visible: !!elem && !elem.hidden,
                };
            });

            return state;
        }, this.elem, fieldSelectors);

        const reminderFieldEl = await query(this.elem, '.reminder-field');
        res.reminderField = await ReminderField.create(this, reminderFieldEl);

        res.closeBtn = { elem: await query(this.elem, '.close-btn') };

        return res;
    }

    async close() {
        return click(this.content.closeBtn.elem);
    }

    static getAccountOrPerson(accountId, state) {
        const { profile, accounts, persons } = state;
        const account = accounts.getItem(accountId);
        if (!account) {
            return null;
        }
        if (account.owner_id === profile.owner_id) {
            return account.name;
        }

        const person = persons.getItem(account.owner_id);
        return person.name;
    }

    static render(item, state) {
        const srcCurr = App.currency.getItem(item.src_curr);
        assert(srcCurr, `Currency not found: ${item.src_curr}`);
        const destCurr = App.currency.getItem(item.dest_curr);
        assert(destCurr, `Currency not found: ${item.dest_curr}`);

        const showSource = item.src_id !== 0;
        const showDest = item.dest_id !== 0;
        const isDiff = item.src_curr !== item.dest_curr;

        const category = state.categories.getItem(item.category_id);
        const categoryTitle = (category)
            ? category.name
            : __('categories.noCategory');

        // Reminder field
        const remindersAvailable = App.state.schedule.length > 0;
        const reminderId = parseInt((item.reminder_id ?? 0), 10);
        const scheduleId = parseInt((item.schedule_id ?? 0), 10);
        const hasReminder = remindersAvailable && reminderId !== 0;

        const res = {
            title: {
                visible: true,
                value: Transaction.typeToString(item.type),
            },
            sourceField: {
                visible: showSource,
            },
            destinationField: {
                visible: showDest,
            },
            srcAmountField: {
                visible: true,
                value: srcCurr.format(item.src_amount),
            },
            destAmountField: {
                visible: isDiff,
            },
            srcResultField: {
                visible: showSource,
            },
            destResultField: {
                visible: showDest,
            },
            dateField: {
                visible: true,
                value: App.secondsToDateString(item.date),
            },
            categoryField: {
                visible: true,
                value: categoryTitle,
            },
            commentField: {
                visible: item.comment.length > 0,
                value: item.comment,
            },
            reminderField: {
                visible: hasReminder,
            },
            createDateField: {
                value: App.secondsToDateString(item.createdate),
                visible: true,
            },
            updateDateField: {
                value: App.secondsToDateString(item.updatedate),
                visible: true,
            },
        };

        if (showSource) {
            res.sourceField.value = this.getAccountOrPerson(item.src_id, state);
            res.srcResultField.value = srcCurr.format(item.src_result);
        }
        if (showDest) {
            res.destinationField.value = this.getAccountOrPerson(item.dest_id, state);
            res.destResultField.value = destCurr.format(item.dest_result);
        }
        if (isDiff) {
            res.destAmountField.value = destCurr.format(item.dest_amount);
        }

        // Reminder field
        if (hasReminder) {
            res.reminderField.value = {
                reminder_id: reminderId.toString(),
                schedule_id: scheduleId.toString(),
                reminder_date: (item.reminder_date ?? 0).toString(),
            };
        }

        return res;
    }
}
