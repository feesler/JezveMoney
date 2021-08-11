import { TestComponent } from 'jezve-test';
import { TransactionListItem } from './TransactionListItem.js';
import { asyncMap } from '../../common.js';

export class TransactionList extends TestComponent {
    async parse() {
        this.renderTime = await this.prop(this.elem, 'dataset.time');

        this.items = [];
        this.details = await this.hasClass(this.elem, 'trans-list_details')
        const itemSelector = (this.details) ? 'tr' : '.trans-list__item-wrapper > div';
        const listItems = await this.queryAll(this.elem, itemSelector);
        if (
            !listItems
            || !listItems.length
            || (listItems.length === 1 && await this.hasClass(listItems[0], 'nodata-message'))
        ) {
            return;
        }

        this.items = await asyncMap(
            listItems,
            (item) => TransactionListItem.create(this.parent, item),
        );
    }

    getItemData(item) {
        if (!item) {
            throw new Error('Invalid item');
        }

        return {
            selected: item.selected,
            amountText: item.amountText,
            amountTitle: item.amountTitle,
            dateFmt: item.dateFmt,
            comment: item.comment,
        };
    }

    getItems() {
        return this.items.map(this.getItemData);
    }

    getSelectedItems() {
        return this.items.filter((item) => item.selected)
            .map(this.getItemData);
    }

    /**
     * @returns {number[]} indexes of active items
     */
    getSelectedIndexes() {
        return this.items.filter((item) => item.isActive)
            .map((item) => this.items.indexOf(item));
    }

    static render(transactions, state) {
        if (!Array.isArray(transactions)) {
            return [];
        }

        return transactions.map((item) => TransactionListItem.render(item, state));
    }

    static renderWidget(transactions, state) {
        if (!Array.isArray(transactions)) {
            throw new Error('Invalid data');
        }

        const res = {
            title: 'Transactions',
            transList: {
                items: this.render(transactions, state),
            },
        };

        return res;
    }
}
