import { assert } from '@jezvejs/assert';
import {
    TestComponent,
    query,
    click,
    evaluate,
} from 'jezve-test';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../../../model/Transaction.js';
import { App } from '../../../Application.js';

export class TransactionListItem extends TestComponent {
    async parseContent() {
        const res = await evaluate((elem, expenseType, incomeType) => {
            const detailsMode = !!elem.querySelector('.trans-item-base_details');
            const item = {
                id: parseInt(elem.dataset.id, 10),
                type: parseInt(elem.dataset.type, 10),
                selected: elem.classList.contains('list-item_selected'),
                detailsMode,
                srcResult: null,
                destResult: null,
            };

            if (detailsMode) {
                const [
                    srcAccEl,
                    dAccEl,
                ] = Array.from(elem.querySelectorAll('.trans-item-base__account-field .field__content'));
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

                // Amounts
                const [
                    sAmount,
                    dAmount,
                ] = Array.from(elem.querySelectorAll('.trans-item-base__amount-field .field__content'));
                const srcAmount = sAmount.textContent;
                if (srcAmount.length > 0 && dAmount?.textContent.length > 0) {
                    item.amountText = `${sign}${srcAmount} (${sign}${dAmount.textContent})`;
                } else {
                    item.amountText = srcAmount;
                }

                // Result balances
                const [
                    sResult,
                    dResult,
                ] = Array.from(elem.querySelectorAll('.trans-item-base__result-field .field__content'));
                if (sResult?.textContent?.length > 0) {
                    item.srcResult = sResult.textContent;
                }
                if (dResult?.textContent?.length > 0) {
                    item.destResult = dResult.textContent;
                }
            } else {
                const titleElem = elem.querySelector('.trans-item-base__title');
                item.accountTitle = titleElem.textContent;

                const amountElem = elem.querySelector('.trans-item-base__amount');
                item.amountText = amountElem.textContent;
            }

            const dateElem = elem.querySelector(
                (detailsMode) ? '.trans-item-base__date-field .field__content' : '.trans-item-base__date',
            );
            item.dateFmt = dateElem?.textContent ?? '';

            const categoryElem = elem.querySelector(
                (detailsMode) ? '.trans-item-base__category-field .field__content' : '.trans-item-base__category',
            );
            item.category = categoryElem.textContent;

            const commentElem = elem.querySelector(
                (detailsMode) ? '.trans-item-base__comment-field .field__content' : '.trans-item-base__comment',
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

    static render(transaction, state, options = {}) {
        const {
            showDate = true,
            showResults = false,
        } = options;

        const res = {};

        assert(transaction, 'Invalid transaction object');
        assert(state, 'Invalid state object');

        const srcAcc = state.accounts.getItem(transaction.src_id);
        const destAcc = state.accounts.getItem(transaction.dest_id);

        const srcCurrency = App.currency.getItem(transaction.src_curr);
        assert(srcCurrency, 'Invalid source currency');

        const destCurrency = App.currency.getItem(transaction.dest_curr);
        assert(destCurrency, 'Invalid destination currency');

        const srcAmountFmt = srcCurrency.format(transaction.src_amount);
        const destAmountFmt = destCurrency.format(transaction.dest_amount);

        if (transaction.type === EXPENSE) {
            res.amountText = `- ${srcAmountFmt}`;
            if (transaction.src_curr !== transaction.dest_curr) {
                res.amountText += ` (- ${destAmountFmt})`;
            }

            res.accountTitle = srcAcc.name;
        } else if (transaction.type === INCOME) {
            res.amountText = `+ ${srcAmountFmt}`;
            if (transaction.src_curr !== transaction.dest_curr) {
                res.amountText += ` (+ ${destAmountFmt})`;
            }

            res.accountTitle = destAcc.name;
        } else if (transaction.type === TRANSFER) {
            res.amountText = srcAmountFmt;
            if (transaction.src_curr !== transaction.dest_curr) {
                res.amountText += ` (${destAmountFmt})`;
            }

            res.accountTitle = `${srcAcc.name} → ${destAcc.name}`;
        } else if (transaction.type === DEBT) {
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
            if (transaction.src_curr !== transaction.dest_curr) {
                res.amountText += ` (${sign}${destAmountFmt})`;
            }
        }

        if (showResults) {
            const showSource = transaction.src_id !== 0;
            const showDest = transaction.dest_id !== 0;

            if (showSource) {
                res.srcResult = srcCurrency.format(transaction.src_result);
            }
            if (showDest) {
                res.destResult = destCurrency.format(transaction.dest_result);
            }
        }

        if (showDate) {
            res.dateFmt = App.secondsToDateString(transaction.date);
        }

        const category = state.categories.getItem(transaction.category_id);
        res.category = (transaction.category_id === 0) ? '' : category.name;

        res.comment = transaction.comment;

        return res;
    }
}
