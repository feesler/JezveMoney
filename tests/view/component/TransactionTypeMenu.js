import {
    TestComponent,
    assert,
    queryAll,
    hasClass,
} from 'jezve-test';
import { asyncMap } from '../../common.js';
import { MenuItem } from './MenuItem.js';

export class TransactionTypeMenu extends TestComponent {
    async parseContent() {
        const res = {
            items: [],
            selectedTypes: [],
            multi: await hasClass(this.elem, 'trtype-menu-multi'),
        };

        const menuItemElems = await queryAll(this.elem, '.trtype-menu__item');
        const menuItems = await asyncMap(menuItemElems, (elem) => (
            MenuItem.create(this.parent, elem)
        ));
        menuItems.forEach((item) => {
            if (item.isActive) {
                res.selectedTypes.push(item.type);
            }

            res.items[item.type] = item;
        });

        return res;
    }

    isSameSelected(type) {
        const data = Array.isArray(type) ? type : [type];

        if (this.content.selectedTypes.length !== data.length) {
            return false;
        }

        if (data.some((item) => !this.content.selectedTypes.includes(item))) {
            return false;
        }
        if (this.content.selectedTypes.some((item) => !data.includes(item))) {
            return false;
        }

        return true;
    }

    isSingleSelected(type) {
        return this.content.selectedTypes.length === 1 && this.content.selectedTypes[0] === type;
    }

    getSelectedTypes() {
        return this.content.selectedTypes;
    }

    async select(type) {
        assert(this.content.items[type], `MenuItem of type '${type}' not found`);

        return this.content.items[type].click();
    }

    async toggle(type) {
        assert(this.content.items[type], `MenuItem of type '${type}' not found`);

        return this.content.items[type].toggle();
    }
}
