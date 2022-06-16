import {
    TestComponent,
    queryAll,
    hasClass,
    assert,
} from 'jezve-test';
import { Tile } from './Tile.js';
import { AccountsList } from '../../model/AccountsList.js';
import { PersonsList } from '../../model/PersonsList.js';
import { asyncMap } from '../../common.js';

export class TilesList extends TestComponent {
    constructor(parent, elem, tileClass) {
        super(parent, elem);

        assert(tileClass, 'Invalid tile constructor specified');

        this.tileClass = tileClass;
    }

    get items() {
        return this.content.items;
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
        assert(item, 'Invalid item');

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
        assert.instanceOf(accountsList, AccountsList, 'Invalid data');

        const visibleAccounts = accountsList.getVisible(true);
        const res = {
            items: visibleAccounts.map(Tile.renderAccount),
        };

        return res;
    }

    static renderHiddenAccounts(accountsList) {
        assert.instanceOf(accountsList, AccountsList, 'Invalid data');

        const hiddenAccounts = accountsList.getHidden(true);
        const res = {
            items: hiddenAccounts.map(Tile.renderAccount),
        };

        return res;
    }

    static renderPersons(personsList, withDebts) {
        assert.instanceOf(personsList, PersonsList, 'Invalid data');

        const visiblePersons = personsList.getVisible(true);
        const res = {
            items: visiblePersons.map((p) => Tile.renderPerson(p, withDebts)),
        };

        return res;
    }

    static renderHiddenPersons(personsList) {
        assert.instanceOf(personsList, PersonsList, 'Invalid data');

        const hiddenPersons = personsList.getHidden(true);
        const res = {
            items: hiddenPersons.map((p) => Tile.renderPerson(p, false)),
        };

        return res;
    }
}
