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
import { ScheduledTransaction } from '../../../model/ScheduledTransaction.js';
import { __ } from '../../../model/locale.js';

/**
 * Scheduled transactions list item test component
 */
export class ScheduleListItem extends TestComponent {
    static getExpectedState(options = {}, state = App.state) {
        const {
            item,
            detailsMode = false,
        } = options;

        const res = {};

        assert.instanceOf(item, ScheduledTransaction, 'Invalid item');
        assert(state, 'Invalid state object');

        if (detailsMode) {
            res.startDate = App.secondsToDateString(item.start_date);
            res.endDate = this.renderEndDate(item);
        } else {
            res.dateRange = this.renderDateRange(item);
        }

        res.interval = item.renderInterval();
        res.offset = item.renderIntervalOffset();

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

        const category = state.categories.getItem(item.category_id);
        res.category = (item.category_id === 0) ? '' : category.name;

        res.comment = item.comment;

        return res;
    }

    static renderDateRange(item) {
        const startDateFmt = App.secondsToDateString(item.start_date);
        const start = __('schedule.item.start', App.view.locale, startDateFmt);
        if (!item.end_date) {
            return start;
        }

        const endDateFmt = App.secondsToDateString(item.end_date);
        const end = __('schedule.item.end', App.view.locale, endDateFmt);
        return `${start} ${end}`;
    }

    static renderEndDate(item) {
        if (!item.end_date) {
            return __('schedule.noEndDate', App.view.locale);
        }

        return __('schedule.item.end', App.view.locale, App.secondsToDateString(item.end_date));
    }

    async parseContent() {
        const res = await evaluate((elem, expenseType, incomeType) => {
            const detailsMode = elem.classList.contains('schedule-item_details');
            const item = {
                id: parseInt(elem.dataset.id, 10),
                type: parseInt(elem.dataset.type, 10),
                selected: elem.classList.contains('schedule-item_selected'),
                detailsMode,
            };

            // Schedule fields
            if (detailsMode) {
                const startDateElem = elem.querySelector(
                    (detailsMode)
                        ? '.schedule-item__start-date-field .field__content'
                        : '.schedule-item__start-date',
                );
                item.startDate = startDateElem?.textContent;
                const endDateElem = elem.querySelector(
                    (detailsMode)
                        ? '.schedule-item__end-date-field .field__content'
                        : '.schedule-item__end-date',
                );
                item.endDate = endDateElem?.textContent;
            } else {
                const dateRangeElem = elem.querySelector(
                    (detailsMode)
                        ? '.schedule-item__date-range-field .field__content'
                        : '.schedule-item__date-range',
                );
                item.dateRange = dateRangeElem?.textContent;
            }

            const intervalElem = elem.querySelector(
                (detailsMode)
                    ? '.schedule-item__interval-field .field__content'
                    : '.schedule-item__interval',
            );
            item.interval = intervalElem?.textContent;

            const offsetElem = elem.querySelector(
                (detailsMode)
                    ? '.schedule-item__offset-field .field__content'
                    : '.schedule-item__offset',
            );
            item.offset = offsetElem?.textContent;

            // Transaction fields
            if (detailsMode) {
                const [
                    srcAccEl,
                    dAccEl,
                ] = Array.from(elem.querySelectorAll('.schedule-item__account-field .field__content'));
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
                ] = Array.from(elem.querySelectorAll('.schedule-item__amount-field .field__content'));
                const srcAmount = sAmount.textContent;
                if (srcAmount.length > 0 && dAmount?.textContent.length > 0) {
                    item.amountText = `${sign}${srcAmount} (${sign}${dAmount.textContent})`;
                } else {
                    item.amountText = srcAmount;
                }
            } else {
                const titleElem = elem.querySelector('.schedule-item__title');
                item.accountTitle = titleElem.textContent;

                const amountElem = elem.querySelector('.schedule-item__amount');
                item.amountText = amountElem.textContent;
            }

            const categoryElem = elem.querySelector(
                (detailsMode) ? '.schedule-item__category-field .field__content' : '.schedule-item__category',
            );
            item.category = categoryElem?.textContent;

            const commentElem = elem.querySelector(
                (detailsMode) ? '.schedule-item__comment-field .field__content' : '.schedule-item__comment',
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
}
