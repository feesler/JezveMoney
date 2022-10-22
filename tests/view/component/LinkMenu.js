import {
    TestComponent,
    assert,
    query,
    queryAll,
    hasClass,
    attr,
    prop,
    click,
} from 'jezve-test';
import { Checkbox } from 'jezvejs-test';
import { asyncMap } from '../../common.js';

export class LinkMenu extends TestComponent {
    async parseContent() {
        const validClass = await hasClass(this.elem, 'link-menu');
        assert(validClass, 'Unexpected stucture of link menu');

        const itemElems = await queryAll(this.elem, '.link-menu-item');
        const multipleAttr = await attr(this.elem, 'multiple');

        const res = {
            multiple: (multipleAttr !== null),
            items: await asyncMap(itemElems, (elem) => this.parseItem(elem)),
        };

        const selected = this.getSelectedValues(res);
        if (res.multiple) {
            res.value = selected;
        } else {
            res.value = (selected.length > 0) ? selected[0] : null;
        }

        return res;
    }

    async parseItem(elem) {
        assert(elem, 'Invalid element');

        const res = {
            elem,
        };

        const tagName = await prop(elem, 'tagName');
        if (tagName === 'A') {
            res.linkElem = elem;
        } else {
            res.linkElem = await query(elem, 'a');
        }

        let titleElem = await query(elem, '.link-menu-item__title');
        if (!titleElem) {
            titleElem = elem;
        }
        const title = await prop(titleElem, 'textContent');
        res.title = title.trim();

        res.value = await prop(elem, 'dataset.value');

        res.isCheckbox = await hasClass(elem, 'checkbox');
        if (res.isCheckbox) {
            res.checkbox = await Checkbox.create(this, elem);
            res.selected = res.checkbox.checked;
        } else {
            res.selected = await hasClass(elem, 'link-menu-item_selected');
        }

        return res;
    }

    get value() {
        return this.content.value;
    }

    get items() {
        return this.content.items;
    }

    getSelectedItems(cont = this.content) {
        return cont.items.filter((item) => item.selected);
    }

    getSelectedValues(cont = this.content) {
        return cont.items.filter((item) => (
            typeof item.value !== 'undefined'
            && item.value !== null
            && item.selected
        )).map((item) => item.value);
    }

    isSameSelected(value) {
        const values = Array.isArray(value) ? value : [value];
        const data = values.map((item) => item.toString());
        const selected = Array.isArray(this.value) ? this.value : [this.value];

        if (selected.length !== data.length) {
            return false;
        }

        if (data.some((item) => !selected.includes(item))) {
            return false;
        }
        if (selected.some((item) => !data.includes(item))) {
            return false;
        }

        return true;
    }

    findItemByValue(value) {
        const str = value.toString();
        return this.items.find((item) => item.value === str);
    }

    async selectItemByIndex(index) {
        assert.arrayIndex(this.items, index);
        const item = this.items[index];

        await click(item.linkElem);
    }

    async selectItemByValue(value) {
        const item = this.findItemByValue(value);
        assert(item, `Item '${value}' not found`);

        await click(item.linkElem);
    }

    async select(value) {
        await this.selectItemByValue(value);
    }

    async toggle(value) {
        const item = this.findItemByValue(value);
        assert(item, `Item '${value}' not found`);
        assert(item.checkbox, 'Check not available');

        await item.checkbox.toggle();
    }
}
