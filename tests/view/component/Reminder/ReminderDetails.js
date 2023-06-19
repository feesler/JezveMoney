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

export class ReminderDetails extends TestComponent {
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

    static render(item, state) {
        assert.instanceOf(item, Reminder, 'Invalid item');
        assert(state, 'Invalid state object');

        item.extend(state);

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
            : __('categories.noCategory', App.view.locale);

        const res = {
            title: {
                visible: true,
                value: Transaction.typeToString(item.type, App.view.locale),
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
            dateField: {
                visible: true,
                value: App.secondsToDateString(item.date),
            },
            categoryField: {
                visible: true,
                value: categoryTitle,
            },
            commentField: {
                visible: true,
                value: item.comment,
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
        }
        if (showDest) {
            res.destinationField.value = this.getAccountOrPerson(item.dest_id, state);
        }
        if (isDiff) {
            res.destAmountField.value = destCurr.format(item.dest_amount);
        }

        return res;
    }
}
