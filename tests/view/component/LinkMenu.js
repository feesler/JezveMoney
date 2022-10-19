import {
    TestComponent,
    assert,
    query,
    queryAll,
    hasClass,
    prop,
    click,
} from 'jezve-test';
import { asyncMap } from '../../common.js';

export class LinkMenu extends TestComponent {
    async parseContent() {
        const validClass = await hasClass(this.elem, 'link-menu');
        assert(validClass, 'Unexpected stucture of link menu');

        const itemElems = await queryAll(this.elem, '.link-menu-item');

        const res = {
            items: await asyncMap(itemElems, (elem) => this.parseItem(elem)),
        };
        const active = this.getActiveItem(res);
        res.value = (active) ? active.value : null;

        return res;
    }

    async parseItem(elem) {
        assert(elem, 'Invalid element');

        let titleElem = await query(elem, '.link-menu-item__title');
        if (!titleElem) {
            titleElem = elem;
        }
        let title = await prop(titleElem, 'textContent');
        title = title.trim();

        const res = {
            elem,
            title,
            value: await prop(elem, 'dataset.value'),
            active: await hasClass(elem, 'link-menu-item_active'),
        };

        return res;
    }

    get value() {
        return this.content.value;
    }

    getActiveItem(cont = this.content) {
        return cont.items.find((item) => item.active);
    }

    findItemByValue(value) {
        return this.content.items.find((item) => item.value === value);
    }

    async selectItemByValue(value) {
        const item = this.findItemByValue(value);
        assert(item, `Item '${value}' not found`);

        await click(item.elem);
    }
}
