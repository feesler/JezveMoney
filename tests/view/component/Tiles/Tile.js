import {
    TestComponent,
    assert,
    click,
    evaluate,
} from 'jezve-test';
import { App } from '../../../Application.js';
import { __ } from '../../../model/locale.js';

export class Tile extends TestComponent {
    async parseContent() {
        const res = await evaluate((elem) => {
            if (!elem?.classList?.contains('tile')) {
                return null;
            }

            const props = {
                id: parseInt(elem.dataset.id, 10),
                title: elem.querySelector('.tile__title')?.textContent,
                subtitle: '',
                isActive: elem.classList.contains('tile_selected'),
            };

            const subtitleEl = elem.querySelector('.tile__subtitle');

            if (subtitleEl) {
                props.subtitle = (subtitleEl?.childElementCount > 0)
                    ? Array.from(subtitleEl.children)
                        .map((el) => el.textContent.trim())
                        .join('\n')
                    : subtitleEl.textContent;
            }

            const svgUseElem = elem.querySelector('.tile__icon use');
            let iconName = svgUseElem?.href?.baseVal;
            if (typeof iconName === 'string' && iconName.startsWith('#')) {
                iconName = iconName.substring(1);
            }
            props.iconName = iconName;

            return props;
        }, this.elem);
        assert(res, 'Invalid structure of tile');

        const icon = App.icons.findByFile(res.iconName);
        res.icon_id = icon?.id ?? 0;

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
            res.subtitle = (debtAccounts.length)
                ? debtAccounts.join('\n')
                : __('persons.noDebts');
        } else {
            res.subtitle = '';
        }

        return res;
    }
}
