import { Component } from './component.js';
import { Currency } from '../../model/currency.js';

export class InfoTile extends Component {
    async parse() {
        if (!this.elem || !await this.hasClass(this.elem, 'info-tile')) {
            throw new Error('Wrong info tile structure');
        }

        this.titleEl = await this.query(this.elem, '.info-tile__title');
        this.subtitleEl = await this.query(this.elem, '.info-tile__subtitle');

        this.title = await this.prop(this.titleEl, 'textContent');
        this.subtitle = await this.prop(this.subtitleEl, 'innerText');
        this.subtitle = this.subtitle.split('\r\n').join('\n');
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
