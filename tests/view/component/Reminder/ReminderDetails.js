import {
    TestComponent,
    query,
    click,
    assert,
    evaluate,
} from 'jezve-test';
import { App } from '../../../Application.js';
import { __ } from '../../../model/locale.js';
import { Transaction } from '../../../model/Transaction.js';
import { Reminder } from '../../../model/Reminder.js';

const fieldSelectors = {
    sourceField: '.source-field',
    destinationField: '.destination-field',
    srcAmountField: '.src-amount-field',
    destAmountField: '.dest-amount-field',
    dateField: '.date-field',
    categoryField: '.category-field',
    commentField: '.comment-field',
    createDateField: '.create-date-field',
    updateDateField: '.update-date-field',
};

/**
 * Reminder details test component
 */
export class ReminderDetails extends TestComponent {
    static getExpectedState(reminder, state) {
        assert.instanceOf(reminder, Reminder, 'Invalid item');
        assert(state, 'Invalid state object');

        reminder.extend(state);

        const srcCurr = App.currency.getItem(reminder.src_curr);
        assert(srcCurr, `Currency not found: ${reminder.src_curr}`);
        const destCurr = App.currency.getItem(reminder.dest_curr);
        assert(destCurr, `Currency not found: ${reminder.dest_curr}`);

        const showSource = reminder.src_id !== 0;
        const showDest = reminder.dest_id !== 0;
        const isDiff = reminder.src_curr !== reminder.dest_curr;

        const category = state.categories.getItem(reminder.category_id);
        const categoryTitle = (category)
            ? category.name
            : __('categories.noCategory', App.view.locale);

        const res = {
            title: {
                visible: true,
                value: Transaction.typeToString(reminder.type, App.view.locale),
            },
            sourceField: {
                visible: showSource,
            },
            destinationField: {
                visible: showDest,
            },
            srcAmountField: {
                visible: true,
                value: srcCurr.format(reminder.src_amount),
            },
            destAmountField: {
                visible: isDiff,
            },
            dateField: {
                visible: true,
                value: App.secondsToDateString(reminder.date),
            },
            categoryField: {
                visible: true,
                value: categoryTitle,
            },
            commentField: {
                visible: true,
                value: reminder.comment,
            },
            createDateField: {
                value: App.secondsToDateString(reminder.createdate),
                visible: true,
            },
            updateDateField: {
                value: App.secondsToDateString(reminder.updatedate),
                visible: true,
            },
        };

        if (showSource) {
            res.sourceField.value = this.getAccountOrPerson(reminder.src_id, state);
        }
        if (showDest) {
            res.destinationField.value = this.getAccountOrPerson(reminder.dest_id, state);
        }
        if (isDiff) {
            res.destAmountField.value = destCurr.format(reminder.dest_amount);
        }

        return res;
    }

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
}
