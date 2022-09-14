import {
    TestComponent,
    queryAll,
    prop,
    hasClass,
    assert,
} from 'jezve-test';
import { TransactionListItem } from './TransactionListItem.js';
import { asyncMap } from '../../../common.js';

export class TransactionList extends TestComponent {
    async parseContent() {
        const res = {
            renderTime: await prop(this.elem, 'dataset.time'),
        };

        res.items = [];
        res.details = await hasClass(this.elem, 'trans-list_details');
        const itemSelector = (res.details) ? 'tr' : '.trans-item__wrapper > div';
        const listItems = await queryAll(this.elem, itemSelector);
        if (
            !listItems
            || !listItems.length
            || (listItems.length === 1 && await hasClass(listItems[0], 'nodata-message'))
        ) {
            return res;
        }

        res.items = await asyncMap(
            listItems,
            (item) => TransactionListItem.create(this.parent, item),
        );

        return res;
    }

    getItemData(item) {
        assert(item, 'Invalid item');

        return {
            selected: item.content.selected,
            amountText: item.content.amountText,
            amountTitle: item.content.amountTitle,
            dateFmt: item.content.dateFmt,
            comment: item.content.comment,
        };
    }

    getItems() {
        return this.content.items.map(this.getItemData);
    }

    getSelectedItems() {
        return this.content.items.filter((item) => item.content.selected)
            .map(this.getItemData);
    }

    /**
     * @returns {number[]} indexes of active items
     */
    getSelectedIndexes() {
        return this.content.items.filter((item) => item.content.isActive)
            .map((item) => this.content.items.indexOf(item));
    }

    static render(transactions, state) {
        if (!Array.isArray(transactions)) {
            return [];
        }

        return transactions.map((item) => TransactionListItem.render(item, state));
    }

    static renderWidget(transactions, state) {
        assert.isArray(transactions, 'Invalid data');

        const res = {
            title: 'Transactions',
            transList: {
                items: this.render(transactions, state),
            },
        };

        return res;
    }
}
