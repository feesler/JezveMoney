import {
    TestComponent,
    assert,
    query,
    prop,
    hasClass,
    click,
} from 'jezve-test';
import { Icon } from '../../model/Icon.js';
import { Currency } from '../../model/Currency.js';

export class Tile extends TestComponent {
    async parseContent() {
        const validClass = await hasClass(this.elem, 'tile');
        assert(validClass, 'Invalid structure of tile');

        const res = {
            linkElem: await query(this.elem, '.tilelink'),
            balanceEL: await query(this.elem, '.tile__subtitle'),
            nameEL: await query(this.elem, '.tile__title'),
            id: parseInt(await prop(this.elem, 'dataset.id'), 10),
        };

        res.balance = await prop(res.balanceEL, 'textContent');
        res.name = await prop(res.nameEL, 'textContent');

        res.isActive = await hasClass(this.elem, 'tile_selected');

        res.iconElem = await query(this.elem, '.tile__icon > svg');
        if (res.iconElem) {
            const svgUseElem = await query(res.iconElem, 'use');

            let iconHRef = await prop(svgUseElem, 'href.baseVal');
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
        await click(this.content.linkElem);
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
