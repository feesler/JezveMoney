import { AppComponent } from './AppComponent.js';
import { Icon } from '../../model/Icon.js';
import { Currency } from '../../model/Currency.js';

export class Tile extends AppComponent {
    async parseContent() {
        if (!this.elem || !await this.hasClass(this.elem, 'tile')) {
            throw new Error('Wrong tile structure');
        }

        const res = {
            linkElem: await this.query(this.elem, '.tilelink'),
            balanceEL: await this.query(this.elem, '.tile__subtitle'),
            nameEL: await this.query(this.elem, '.tile__title'),
            id: parseInt(await this.prop(this.elem, 'dataset.id'), 10),
        };

        res.balance = await this.prop(res.balanceEL, 'textContent');
        res.name = await this.prop(res.nameEL, 'textContent');

        res.isActive = await this.hasClass(this.elem, 'tile_selected');

        res.iconElem = await this.query(this.elem, '.tile__icon > svg');
        if (res.iconElem) {
            const svgUseElem = await this.query(res.iconElem, 'use');

            let iconHRef = await this.prop(svgUseElem, 'href.baseVal');
            if (typeof iconHRef === 'string' && iconHRef.startsWith('#')) {
                iconHRef = iconHRef.substr(1);
            }

            const iconObj = Icon.findByFile(iconHRef);
            res.icon_id = (iconObj) ? iconObj.id : 0;
        } else {
            res.icon_id = 0;
        }

        return res;
    }

    async click() {
        await this.environment.click(this.content.linkElem);
    }

    static renderAccount(account) {
        const res = {};

        res.balance = Currency.format(account.curr_id, account.balance);
        res.name = account.name;
        res.icon_id = account.icon_id;

        return res;
    }

    static renderPerson(person) {
        const res = {
            name: person.name,
            balance: null,
        };

        return res;
    }
}
