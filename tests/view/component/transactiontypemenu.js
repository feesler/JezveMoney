import { TestComponent } from 'jezve-test';
import { MenuItem } from './menuitem.js';

export class TransactionTypeMenu extends TestComponent {
    async parse() {
        this.items = [];
        this.selectedTypes = [];

        this.multi = await this.hasClass(this.elem, 'trtype-menu-multi');

        const menuItems = await this.queryAll(this.elem, '.trtype-menu__item');
        for (const item of menuItems) {
            const menuItemObj = await MenuItem.create(this.parent, item);

            if (menuItemObj.isActive) {
                this.selectedTypes.push(menuItemObj.type);
            }

            this.items[menuItemObj.type] = menuItemObj;
        }
    }

    isSameSelected(type) {
        const data = Array.isArray(type) ? type : [type];

        if (this.selectedTypes.length !== data.length) {
            return false;
        }

        if (data.some((item) => !this.selectedTypes.includes(item))) {
            return false;
        }
        if (this.selectedTypes.some((item) => !data.includes(item))) {
            return false;
        }

        return true;
    }

    isSingleSelected(type) {
        return this.selectedTypes.length === 1 && this.selectedTypes[0] === type;
    }

    getSelectedTypes() {
        return this.selectedTypes;
    }

    async select(type) {
        if (!this.items[type]) {
            throw new Error(`MenuItem of type '${type}' not found`);
        }

        return this.items[type].click();
    }

    async toggle(type) {
        if (!this.items[type]) {
            throw new Error(`MenuItem of type '${type}' not found`);
        }

        return this.items[type].toggle();
    }
}
