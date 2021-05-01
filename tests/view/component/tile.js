import { TestComponent } from 'jezve-test';
import { Icon } from '../../model/icon.js';
import { Currency } from '../../model/currency.js';

export class Tile extends TestComponent {
    async parse() {
        if (!this.elem || !await this.hasClass(this.elem, 'tile')) {
            throw new Error('Wrong tile structure');
        }

        this.linkElem = await this.query(this.elem, '.tilelink');
        this.balanceEL = await this.query(this.elem, '.tile__subtitle');
        this.nameEL = await this.query(this.elem, '.tile__title');

        this.id = parseInt(await this.prop(this.elem, 'dataset.id'), 10);
        this.balance = await this.prop(this.balanceEL, 'textContent');
        this.name = await this.prop(this.nameEL, 'textContent');

        this.isActive = await this.hasClass(this.elem, 'tile_selected');

        this.iconElem = await this.query(this.elem, '.tile__icon > svg');
        if (this.iconElem) {
            const svgUseElem = await this.query(this.iconElem, 'use');

            let iconHRef = await this.prop(svgUseElem, 'href.baseVal');
            if (typeof iconHRef === 'string' && iconHRef.startsWith('#')) {
                iconHRef = iconHRef.substr(1);
            }

            const iconObj = Icon.findByFile(iconHRef);
            this.icon_id = (iconObj) ? iconObj.id : 0;
        } else {
            this.icon_id = 0;
        }
    }

    async click() {
        await this.environment.click(this.linkElem);
    }

    static renderAccount(account) {
        const res = {
            balance: Currency.format(account.curr_id, account.balance),
            name: account.name,
            icon_id: account.icon_id,
        };

        return res;
    }

    static renderPerson(person) {
        const res = {
            name: person.name,
            balance: '',
        };

        return res;
    }
}
