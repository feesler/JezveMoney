import { TestComponent } from 'jezve-test';
import { Tile } from './Tile.js';
import { AccountsList } from '../../model/AccountsList.js';
import { PersonsList } from '../../model/PersonsList.js';
import { asyncMap } from '../../common.js';
import { queryAll, hasClass } from '../../env.js';

export class TilesList extends TestComponent {
    constructor(parent, elem, tileClass) {
        super(parent, elem);

        if (!tileClass) {
            throw new Error('Invalid tile constructor specified');
        }

        this.tileClass = tileClass;
    }

    async parseContent() {
        const res = {
            items: [],
        };
        const listItems = await queryAll(this.elem, ':scope > *');
        if (
            !listItems
            || !listItems.length
            || (listItems.length === 1 && await hasClass(listItems[0], 'nodata-message'))
        ) {
            return res;
        }

        res.items = await asyncMap(listItems, (item) => this.tileClass.create(this.parent, item));
        res.items.sort((a, b) => a.id - b.id);

        return res;
    }

    getItemData(item) {
        if (!item) {
            throw new Error('Invalid item');
        }

        return {
            id: item.content.id,
            balance: item.content.balance,
            name: item.content.name,
            isActive: item.content.isActive,
            icon_id: item.content.icon_id,
        };
    }

    itemsCount() {
        return this.content.items.length;
    }

    getItems() {
        return this.content.items.map(this.getItemData);
    }

    /**
     * @returns {array} active items
     */
    getActive() {
        return this.content.items.filter((item) => item.content.isActive)
            .map(this.getItemData);
    }

    /**
     * @returns {number[]} indexes of active items
     */
    getSelectedIndexes() {
        return this.content.items.filter((item) => item.content.isActive)
            .map((item) => this.content.items.indexOf(item));
    }

    static renderAccounts(accountsList) {
        if (!(accountsList instanceof AccountsList)) {
            throw new Error('Invalid data');
        }

        const visibleAccounts = accountsList.getVisible(true);
        const res = {
            items: visibleAccounts.map(Tile.renderAccount),
        };

        return res;
    }

    static renderHiddenAccounts(accountsList) {
        if (!(accountsList instanceof AccountsList)) {
            throw new Error('Invalid data');
        }

        const hiddenAccounts = accountsList.getHidden(true);
        const res = {
            items: hiddenAccounts.map(Tile.renderAccount),
        };

        return res;
    }

    static renderPersons(personsList, tileClass = Tile) {
        if (!(personsList instanceof PersonsList)) {
            throw new Error('Invalid data');
        }
        if (!tileClass) {
            throw new Error('Invalid tile constructor specified');
        }

        const visiblePersons = personsList.getVisible(true);
        const res = {
            items: visiblePersons.map(tileClass.renderPerson),
        };

        return res;
    }

    static renderHiddenPersons(personsList, tileClass = Tile) {
        if (!(personsList instanceof PersonsList)) {
            throw new Error('Invalid data');
        }
        if (!tileClass) {
            throw new Error('Invalid tile constructor specified');
        }

        const hiddenPersons = personsList.getHidden(true);
        const res = {
            items: hiddenPersons.map(tileClass.renderPerson),
        };

        return res;
    }
}
