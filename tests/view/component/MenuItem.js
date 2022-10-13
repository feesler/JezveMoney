import {
    TestComponent,
    assert,
    query,
    prop,
    hasClass,
    click,
} from 'jezve-test';
import { Checkbox } from 'jezvejs-test';

export class MenuItem extends TestComponent {
    async parseContent() {
        assert(this.elem, 'Wrong structure of menu item');

        const res = {};

        const typeId = await prop(this.elem, 'dataset.type');
        res.type = parseInt(typeId, 10);
        assert(!Number.isNaN(res.type), `Invalid transaction type ${typeId}`);

        res.isCheckbox = await hasClass(this.elem, 'checkbox');
        if (res.isCheckbox) {
            res.checkbox = await Checkbox.create(this, this.elem);
            res.isActive = res.checkbox.checked;
            res.titleElem = res.checkbox.content.labelElem;
        } else {
            res.isActive = await hasClass(this.elem, 'trtype-menu__item_selected');
            res.titleElem = await query(this.elem, '.trtype-menu_item_title');
        }

        res.text = await prop(res.titleElem, 'textContent');

        res.linkElem = await query(this.elem, 'a');
        res.link = await prop(res.linkElem, 'href');

        return res;
    }

    get type() {
        return this.content.type;
    }

    get isActive() {
        return this.content.isActive;
    }

    async toggle() {
        assert(this.content.checkbox, 'Check not available');

        await this.content.checkbox.toggle();
    }

    async click() {
        await click(this.content.linkElem);
    }
}
