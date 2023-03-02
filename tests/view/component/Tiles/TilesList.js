import {
    TestComponent,
    query,
    queryAll,
    assert,
    asyncMap,
    prop,
} from 'jezve-test';
import { Tile } from './Tile.js';
import { AccountsList } from '../../../model/AccountsList.js';
import { PersonsList } from '../../../model/PersonsList.js';

export class TilesList extends TestComponent {
    get items() {
        return this.content.items;
    }

    get listMode() {
        return this.content.listMode;
    }

    async parseContent() {
        const res = {};

        const className = await prop(this.elem, 'className');
        if (className.includes('tiles_select')) {
            res.listMode = 'select';
        } else if (className.includes('tiles_sort')) {
            res.listMode = 'sort';
        } else {
            res.listMode = 'list';
        }

        const listItems = await queryAll(this.elem, '.tile');
        res.items = await asyncMap(listItems, (item) => Tile.create(this.parent, item));
        res.noDataMsg = { elem: await query(this.elem, '.nodata-message') };

        return res;
    }

    getItemData(item) {
        assert(item, 'Invalid item');

        return {
            id: item.content.id,
            subtitle: item.content.subtitle,
            title: item.content.title,
            isActive: item.content.isActive,
            icon_id: item.content.icon_id,
        };
    }

    itemsCount() {
        return this.content.items.length;
    }

    getItems() {
        return this.content.items.map((item) => this.getItemData(item));
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

    static renderAccounts(accountsList, sortMode) {
        assert.instanceOf(accountsList, AccountsList, 'Invalid data');

        const visibleAccounts = accountsList.getVisible();
        visibleAccounts.sortBy(sortMode);
        return {
            items: visibleAccounts.map(Tile.renderAccount),
        };
    }

    static renderHiddenAccounts(accountsList, sortMode) {
        assert.instanceOf(accountsList, AccountsList, 'Invalid data');

        const hiddenAccounts = accountsList.getHidden();
        hiddenAccounts.sortBy(sortMode);
        return {
            items: hiddenAccounts.map(Tile.renderAccount),
        };
    }

    static renderPersons(personsList, withDebts, sortMode) {
        assert.instanceOf(personsList, PersonsList, 'Invalid data');

        const visiblePersons = personsList.getVisible();
        visiblePersons.sortBy(sortMode);
        return {
            items: visiblePersons.map((p) => Tile.renderPerson(p, withDebts)),
        };
    }

    static renderHiddenPersons(personsList, withDebts, sortMode) {
        assert.instanceOf(personsList, PersonsList, 'Invalid data');

        const hiddenPersons = personsList.getHidden();
        hiddenPersons.sortBy(sortMode);
        return {
            items: hiddenPersons.map((p) => Tile.renderPerson(p, withDebts)),
        };
    }
}
