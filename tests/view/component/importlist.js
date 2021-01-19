import { Component } from './component.js';
import { ImportListItem } from './importlistitem.js';
import { asyncMap, copyObject } from '../../common.js';

export class ImportList extends Component {
    constructor(parent, elem, mainAccount) {
        super(parent, elem);

        this.mainAccount = mainAccount;

        this.model = {};
    }

    async parse() {
        this.items = [];

        const listItems = await this.queryAll(this.elem, ':scope > *');
        if (
            !listItems
            || !listItems.length
            || (listItems.length === 1 && await this.hasClass(listItems[0], 'nodata-message'))
        ) {
            return;
        }

        this.items = await asyncMap(
            listItems,
            (item) => ImportListItem.create(this.parent, item, this.mainAccount),
        );
    }

    getItem(index) {
        const ind = parseInt(index, 10);
        if (Number.isNaN(ind) || ind < 0 || ind >= this.items.length) {
            throw new Error(`Invalid index of item: ${index}`);
        }

        return this.items[ind];
    }

    getItemData(item) {
        if (!item) {
            throw new Error('Invalid item');
        }

        const res = copyObject(item.data);

        return res;
    }

    getItems() {
        return this.items.map((item) => this.getItemData(item));
    }

    getEnabledItems() {
        return this.items.filter((item) => item.model.enabled);
    }

    getExpectedState() {
        return {
            items: this.items.map(
                (item) => copyObject(item.getExpectedState(item.model).values),
            ),
        };
    }

    static render(transactions, state) {
        if (!Array.isArray(transactions)) {
            throw new Error('Invalid data');
        }

        return {
            items: transactions.map((item) => ImportListItem.render(item, state)),
        };
    }
}
