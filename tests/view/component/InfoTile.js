import {
    TestComponent,
    assert,
    query,
    prop,
    hasClass,
} from 'jezve-test';
import { Currency } from '../../model/Currency.js';

export class InfoTile extends TestComponent {
    async parseContent() {
        const validClass = await hasClass(this.elem, 'info-tile');
        assert(validClass, 'Invalid structure of info tile');

        const res = {
            titleEl: await query(this.elem, '.info-tile__title'),
            subtitleEl: await query(this.elem, '.info-tile__subtitle'),
        };

        res.title = await prop(res.titleEl, 'textContent');
        res.subtitle = await prop(res.subtitleEl, 'innerText');
        res.subtitle = res.subtitle.split('\r\n').join('\n');

        return res;
    }

    // Format non-zero balances of person accounts
    // Return array of strings
    /**
     * Format non-zero balances of person accounts
     * Return array of strings
     * @param {Account[]} accounts - array of person accounts
     */
    static filterPersonDebts(accounts) {
        assert.isArray(accounts, 'Unexpected input');

        const res = accounts.filter((item) => item.balance !== 0)
            .map((item) => Currency.format(item.curr_id, item.balance));

        return res;
    }

    static renderPerson(person) {
        assert(person, 'Invalid person');

        const res = {
            title: person.name,
        };

        const debtAccounts = InfoTile.filterPersonDebts(person.accounts);
        res.subtitle = (debtAccounts.length) ? debtAccounts.join('\n') : 'No debts';

        return res;
    }
}
