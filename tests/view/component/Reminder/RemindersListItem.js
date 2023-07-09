import {
    TestComponent,
    query,
    click,
    assert,
    evaluate,
} from 'jezve-test';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../../../model/Transaction.js';
import { App } from '../../../Application.js';
import { Reminder } from '../../../model/Reminder.js';

export class RemindersListItem extends TestComponent {
    async parseContent() {
        const res = await evaluate((elem, expenseType, incomeType) => {
            const detailsMode = elem.classList.contains('reminder-item_details');
            const item = {
                id: elem.dataset.id,
                type: parseInt(elem.dataset.type, 10),
                selected: elem.classList.contains('reminder-item_selected'),
                detailsMode,
            };

            if (detailsMode) {
                const [
                    srcAccEl,
                    dAccEl,
                ] = Array.from(elem.querySelectorAll('.reminder-item__account-field .field__content'));
                const sourceContent = srcAccEl.textContent;
                const destContent = dAccEl.textContent;
                const sourceVisible = sourceContent.length > 0;
                if (sourceVisible && destContent.length > 0) {
                    item.accountTitle = `${sourceContent} → ${destContent}`;
                } else {
                    item.accountTitle = (sourceVisible) ? sourceContent : destContent;
                }

                let sign = '';
                if (item.type === expenseType) {
                    sign = '- ';
                } else if (item.type === incomeType) {
                    sign = '+ ';
                }

                const [
                    sAmount,
                    dAmount,
                ] = Array.from(elem.querySelectorAll('.reminder-item__amount-field .field__content'));
                const srcAmount = sAmount.textContent;
                if (srcAmount.length > 0 && dAmount?.textContent.length > 0) {
                    item.amountText = `${sign}${srcAmount} (${sign}${dAmount.textContent})`;
                } else {
                    item.amountText = srcAmount;
                }
            } else {
                const titleElem = elem.querySelector('.reminder-item__title');
                item.accountTitle = titleElem.textContent;

                const amountElem = elem.querySelector('.reminder-item__amount');
                item.amountText = amountElem.textContent;
            }

            const dateElem = elem.querySelector(
                (detailsMode) ? '.reminder-item__date-field .field__content' : '.reminder-item__date',
            );
            item.dateFmt = dateElem.textContent;

            const categoryElem = elem.querySelector(
                (detailsMode) ? '.reminder-item__category-field .field__content' : '.reminder-item__category',
            );
            item.category = categoryElem?.textContent;

            const commentElem = elem.querySelector(
                (detailsMode) ? '.reminder-item__comment-field .field__content' : '.reminder-item__comment',
            );
            item.comment = commentElem?.textContent ?? '';

            return item;
        }, this.elem, EXPENSE, INCOME);

        res.menuBtn = await query(this.elem, '.menu-btn');

        return res;
    }

    get id() {
        return this.content.id;
    }

    async click() {
        return click(this.elem);
    }

    async clickMenu() {
        return click(this.content.menuBtn);
    }

    static render(item, state) {
        const res = {};

        assert.instanceOf(item, Reminder, 'Invalid item');
        assert(state, 'Invalid state object');

        item.extend(state);

        const srcAcc = state.accounts.getItem(item.src_id);
        const destAcc = state.accounts.getItem(item.dest_id);
        const srcAmountFmt = App.currency.format(item.src_curr, item.src_amount);
        const destAmountFmt = App.currency.format(item.dest_curr, item.dest_amount);

        if (item.type === EXPENSE) {
            res.amountText = `- ${srcAmountFmt}`;
            if (item.src_curr !== item.dest_curr) {
                res.amountText += ` (- ${destAmountFmt})`;
            }

            res.accountTitle = srcAcc.name;
        } else if (item.type === INCOME) {
            res.amountText = `+ ${srcAmountFmt}`;
            if (item.src_curr !== item.dest_curr) {
                res.amountText += ` (+ ${destAmountFmt})`;
            }

            res.accountTitle = destAcc.name;
        } else if (item.type === TRANSFER) {
            res.amountText = srcAmountFmt;
            if (item.src_curr !== item.dest_curr) {
                res.amountText += ` (${destAmountFmt})`;
            }

            res.accountTitle = `${srcAcc.name} → ${destAcc.name}`;
        } else if (item.type === DEBT) {
            res.accountTitle = '';
            const debtType = (!!srcAcc && srcAcc.owner_id !== state.profile.owner_id);
            const personAcc = debtType ? srcAcc : destAcc;
            const person = state.persons.getItem(personAcc.owner_id);
            assert(person, `Person ${personAcc.owner_id} not found`);

            const acc = (debtType) ? destAcc : srcAcc;

            let sign = '';
            if (debtType) {
                res.accountTitle = person.name;
                if (acc) {
                    res.accountTitle += ` → ${acc.name}`;
                } else {
                    sign = '- ';
                }
            } else {
                if (acc) {
                    res.accountTitle = `${acc.name} → `;
                } else {
                    sign = '+ ';
                }
                res.accountTitle += person.name;
            }

            res.amountText = `${sign}${srcAmountFmt}`;
            if (item.src_curr !== item.dest_curr) {
                res.amountText += ` (${sign}${destAmountFmt})`;
            }
        }

        res.dateFmt = App.secondsToDateString(item.date);

        const category = state.categories.getItem(item.category_id);
        res.category = (item.category_id === 0) ? '' : category.name;

        res.comment = item.comment;

        return res;
    }
}
