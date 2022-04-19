import { AppComponent } from './AppComponent.js';
import { Currency } from '../../model/Currency.js';
import {
    query,
    prop,
    hasClass,
} from '../../env.js';

export class InfoTile extends AppComponent {
    async parseContent() {
        if (!this.elem || !await hasClass(this.elem, 'info-tile')) {
            throw new Error('Wrong info tile structure');
        }

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
        if (!Array.isArray(accounts)) {
            throw new Error('Unexpected input');
        }

        const res = accounts.filter((item) => item.balance !== 0)
            .map((item) => Currency.format(item.curr_id, item.balance));

        return res;
    }

    static renderPerson(person) {
        if (!person) {
            throw new Error('Invalid person');
        }

        const res = {
            title: person.name,
        };

        const debtAccounts = InfoTile.filterPersonDebts(person.accounts);
        res.subtitle = (debtAccounts.length) ? debtAccounts.join('\n') : 'No debts';

        return res;
    }
}
