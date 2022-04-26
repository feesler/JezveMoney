import { TestComponent } from 'jezve-test';
import {
    query,
    prop,
    hasClass,
    click,
} from '../../env.js';

export class MenuItem extends TestComponent {
    async parseContent() {
        if (!this.elem) {
            throw new Error('Wrong structure of menu item');
        }

        const res = {};

        const typeId = await prop(this.elem, 'dataset.type');
        res.type = parseInt(typeId, 10);
        if (Number.isNaN(res.type)) {
            throw new Error(`Invalid transaction type ${typeId}`);
        }

        res.titleElem = await query(this.elem, '.trtype-menu_item_title');
        res.text = await prop(res.titleElem, 'textContent');

        res.isActive = await hasClass(this.elem, 'trtype-menu__item_selected');

        res.checkElem = await query(this.elem, '.trtype-menu__item-check');
        res.linkElem = await query(this.elem, 'a');
        res.link = await prop(res.linkElem, 'href');

        return res;
    }

    async toggle() {
        if (!this.content.checkElem) {
            throw new Error('Check not available');
        }

        await click(this.content.checkElem);
    }

    async click() {
        await click(this.content.linkElem);
    }
}
