import {
    TestComponent,
    assert,
    query,
    prop,
    hasClass,
    click,
} from 'jezve-test';

export class MenuItem extends TestComponent {
    async parseContent() {
        assert(this.elem, 'Wrong structure of menu item');

        const res = {};

        const typeId = await prop(this.elem, 'dataset.type');
        res.type = parseInt(typeId, 10);
        assert(!Number.isNaN(res.type), `Invalid transaction type ${typeId}`);

        res.titleElem = await query(this.elem, '.trtype-menu_item_title');
        res.text = await prop(res.titleElem, 'textContent');

        res.isActive = await hasClass(this.elem, 'trtype-menu__item_selected');

        res.checkElem = await query(this.elem, '.trtype-menu__item-check');
        res.linkElem = await query(this.elem, 'a');
        res.link = await prop(res.linkElem, 'href');

        return res;
    }

    async toggle() {
        assert(this.content.checkElem, 'Check not available');

        await click(this.content.checkElem);
    }

    async click() {
        await click(this.content.linkElem);
    }
}
