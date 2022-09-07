import {
    TestComponent,
    assert,
    query,
    prop,
    hasClass,
    click,
} from 'jezve-test';
import { App } from '../../Application.js';

export class Tile extends TestComponent {
    async parseContent() {
        const validClass = await hasClass(this.elem, 'tile');
        assert(validClass, 'Invalid structure of tile');

        const res = {
            subtitleElem: await query(this.elem, '.tile__subtitle'),
            titleElem: await query(this.elem, '.tile__title'),
            id: parseInt(await prop(this.elem, 'dataset.id'), 10),
        };

        const subtitleText = await prop(res.subtitleElem, 'innerText');
        res.subtitle = (subtitleText)
            ? subtitleText.split('\r\n').join('\n')
            : null;

        res.title = await prop(res.titleElem, 'textContent');

        res.isActive = await hasClass(this.elem, 'tile--selected');

        res.iconElem = await query(this.elem, '.tile__icon > svg');
        if (res.iconElem) {
            const svgUseElem = await query(res.iconElem, 'use');

            let iconHRef = await prop(svgUseElem, 'href.baseVal');
            if (typeof iconHRef === 'string' && iconHRef.startsWith('#')) {
                iconHRef = iconHRef.substr(1);
            }

            const iconObj = App.icons.findByFile(iconHRef);
            res.icon_id = (iconObj) ? iconObj.id : 0;
        } else {
            res.icon_id = 0;
        }

        return res;
    }

    async click() {
        await click(this.elem);
    }

    static renderAccount(account) {
        const res = {};

        res.subtitle = App.currency.format(account.curr_id, account.balance);
        res.title = account.name;
        res.icon_id = account.icon_id;

        return res;
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

    static renderPerson(person, withDebts) {
        assert(person, 'Invalid person');

        const res = {
            title: person.name,
        };

        if (withDebts) {
            const debtAccounts = Tile.filterPersonDebts(person.accounts);
            res.subtitle = (debtAccounts.length) ? debtAccounts.join('\n') : 'No debts';
        } else {
            res.subtitle = null;
        }

        return res;
    }
}
