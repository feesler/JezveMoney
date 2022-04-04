import { AppComponent } from './AppComponent.js';
import { MenuItem } from './MenuItem.js';

export class TransactionTypeMenu extends AppComponent {
    async parseContent() {
        const res = {
            items: [],
            selectedTypes: [],
            multi: await this.hasClass(this.elem, 'trtype-menu-multi'),
        };

        const menuItems = await this.queryAll(this.elem, '.trtype-menu__item');
        for (const item of menuItems) {
            const menuItemObj = await MenuItem.create(this.parent, item);

            if (menuItemObj.content.isActive) {
                res.selectedTypes.push(menuItemObj.content.type);
            }

            res.items[menuItemObj.content.type] = menuItemObj;
        }

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
        if (!this.content.items[type]) {
            throw new Error(`MenuItem of type '${type}' not found`);
        }

        return this.content.items[type].click();
    }

    async toggle(type) {
        if (!this.content.items[type]) {
            throw new Error(`MenuItem of type '${type}' not found`);
        }

        return this.content.items[type].toggle();
    }
}
