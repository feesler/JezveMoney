import {
    TestComponent,
    query,
    click,
    assert,
    evaluate,
    prop,
    asyncMap,
} from 'jezve-test';
import { App } from '../../../Application.js';
import { secondsToDateString } from '../../../common.js';
import { __ } from '../../../model/locale.js';

const fieldSelectors = [
    '.debts-field',
    '.visibility-field',
    '.create-date-field',
    '.update-date-field',
];

export class PersonDetails extends TestComponent {
    async parseContent() {
        const res = {
            closeBtn: { elem: await query(this.elem, '.close-btn') },
            title: { elem: await query(this.elem, '.heading h1') },
        };
        res.title.value = await prop(res.title.elem, 'textContent');

        [
            res.debtField,
            res.visibilityField,
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
