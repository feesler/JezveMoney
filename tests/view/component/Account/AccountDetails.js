import {
    TestComponent,
    query,
    click,
    assert,
    evaluate,
    asyncMap,
} from 'jezve-test';
import { App } from '../../../Application.js';
import { secondsToDateString } from '../../../common.js';
import { __ } from '../../../model/locale.js';

const fieldSelectors = [
    '.balance-field',
    '.initbalance-field',
    '.visibility-field',
    '.trans-count-field',
    '.create-date-field',
    '.update-date-field',
];

export class AccountDetails extends TestComponent {
    get loading() {
        return this.content.loading;
    }

    async parseContent() {
        const res = {
            closeBtn: { elem: await query(this.elem, '.close-btn') },
            title: { elem: await query(this.elem, '.heading h1') },
            transactionsLink: { elem: await query(this.elem, '.transactions-link') },
        };

        [
            res.title.value,
            res.loading,
        ] = await evaluate((titleEl, linkEl) => ([
            titleEl.textContent,
            linkEl.classList.contains('vhidden'),
        ]), res.title.elem, res.transactionsLink.elem);

        [
            res.balanceField,
            res.initialBalanceField,
            res.visibilityField,
            res.transactionsField,
            res.createDateField,
            res.updateDateField,
        ] = await asyncMap(fieldSelectors, async (selector) => (
            this.parseField(await query(this.elem, selector))
        ));

        return res;
    }

    async parseField(elem) {
        assert(elem, 'Invalid field element');

        const titleElem = await query(elem, '.field__title');
        const contentElem = await query(elem, '.field__content');
        assert(titleElem && contentElem, 'Invalid structure of field');

        const res = await evaluate((titleEl, contEl) => ({
            title: titleEl.textContent,
            value: contEl.textContent,
        }), titleElem, contentElem);
        res.elem = elem;

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

        const res = {
            title: {
                visible: true,
                value: item.name,
            },
            balanceField: {
                visible: true,
                value: currency.format(item.balance),
            },
            initialBalanceField: {
                visible: true,
                value: currency.format(item.initbalance),
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
                value: secondsToDateString(item.createdate),
                visible: true,
            },
            updateDateField: {
                value: secondsToDateString(item.updatedate),
                visible: true,
            },
        };

        return res;
    }
}