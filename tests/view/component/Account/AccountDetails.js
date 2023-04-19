import {
    TestComponent,
    query,
    click,
    assert,
    evaluate,
} from 'jezve-test';
import { App } from '../../../Application.js';
import { secondsToDateString } from '../../../common.js';
import { ACCOUNT_TYPE_CREDIT_CARD, getAccountTypeName } from '../../../model/AccountsList.js';
import { __ } from '../../../model/locale.js';

const fieldSelectors = {
    typeField: '.type-field',
    balanceField: '.balance-field',
    initialBalanceField: '.initbalance-field',
    limitField: '.limit-field',
    initialLimitField: '.initlimit-field',
    visibilityField: '.visibility-field',
    transactionsField: '.trans-count-field',
    createDateField: '.create-date-field',
    updateDateField: '.update-date-field',
};

export class AccountDetails extends TestComponent {
    get loading() {
        return this.content.loading;
    }

    async parseContent() {
        const res = await evaluate((el, selectors) => {
            const textElemState = (elem) => ({
                value: elem?.textContent,
                visible: !!elem && !elem.hidden,
            });

            const trLinkEl = el.querySelector('.transactions-link');

            const state = {
                title: textElemState(el.querySelector('.heading h1')),
                loading: trLinkEl?.classList.contains('vhidden'),
                transactionsLink: {
                    visible: !!trLinkEl && !trLinkEl.hidden,
                },
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

    static render(item, state) {
        const currency = App.currency.getItem(item.curr_id);
        assert(currency, `Currency not found: ${item.curr_id}`);

        const hidden = state.accounts.isHidden(item);
        const visibilityToken = (hidden) ? 'ITEM_HIDDEN' : 'ITEM_VISIBLE';

        const itemTransactions = state.transactions.applyFilter({
            accounts: item.id,
        });

        const isCreditCard = item.type === ACCOUNT_TYPE_CREDIT_CARD;
        const dateLocale = state.getDateFormatLocale();

        const res = {
            title: {
                visible: true,
                value: item.name,
            },
            typeField: {
                visible: true,
                value: getAccountTypeName(item.type),
            },
            balanceField: {
                visible: true,
                value: currency.format(item.balance),
            },
            initialBalanceField: {
                visible: true,
                value: currency.format(item.initbalance),
            },
            limitField: {
                visible: isCreditCard,
            },
            initialLimitField: {
                visible: isCreditCard,
            },
            visibilityField: {
                visible: true,
                value: __(visibilityToken, App.view.locale),
            },
            transactionsField: {
                value: itemTransactions.length.toString(),
                visible: true,
            },
            transactionsLink: {
                visible: true,
            },
            createDateField: {
                value: secondsToDateString(item.createdate, dateLocale, App.dateFormatOptions),
                visible: true,
            },
            updateDateField: {
                value: secondsToDateString(item.updatedate, dateLocale, App.dateFormatOptions),
                visible: true,
            },
        };

        if (isCreditCard) {
            res.limitField.value = currency.format(item.limit);
            res.initialLimitField.value = currency.format(item.initlimit);
        }

        return res;
    }
}
