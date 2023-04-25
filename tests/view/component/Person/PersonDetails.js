import {
    TestComponent,
    query,
    click,
    assert,
    evaluate,
} from 'jezve-test';
import { App } from '../../../Application.js';
import { __ } from '../../../model/locale.js';

const fieldSelectors = {
    debtField: '.debts-field',
    visibilityField: '.visibility-field',
    transactionsField: '.trans-count-field',
    createDateField: '.create-date-field',
    updateDateField: '.update-date-field',
};

export class PersonDetails extends TestComponent {
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

    /**
     * Format non-zero balances of person accounts
     * Return array of strings
     * @param {Account[]} accounts - array of person accounts
     */
    static filterPersonDebts(accounts) {
        assert.isArray(accounts, 'Unexpected input');

        const res = accounts.filter((item) => item.balance !== 0)
            .map((item) => App.currency.format(item.curr_id, item.balance));

        return res;
    }

    static render(item, state) {
        const debtAccounts = this.filterPersonDebts(item.accounts);
        const debtValue = (debtAccounts.length)
            ? debtAccounts.join('\n')
            : __('PERSON_NO_DEBTS', App.view.locale);

        const hidden = state.accounts.isHidden(item);
        const visibilityToken = (hidden) ? 'ITEM_HIDDEN' : 'ITEM_VISIBLE';

        const itemTransactions = state.transactions.applyFilter({
            persons: item.id,
        });

        const res = {
            title: {
                visible: true,
                value: item.name,
            },
            debtField: {
                visible: true,
                value: debtValue,
            },
            visibilityField: {
                visible: true,
                value: __(visibilityToken, App.view.locale),
            },
            transactionsField: {
                value: itemTransactions.length.toString(),
                visible: true,
            },
            transactionsLink: { visible: true },
            createDateField: {
                value: App.secondsToDateString(item.createdate),
                visible: true,
            },
            updateDateField: {
                value: App.secondsToDateString(item.updatedate),
                visible: true,
            },
        };

        return res;
    }
}
