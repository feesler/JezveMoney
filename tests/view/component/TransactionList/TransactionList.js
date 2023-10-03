import {
    TestComponent,
    query,
    queryAll,
    assert,
    evaluate,
    asyncMap,
} from 'jezve-test';
import { __ } from '../../../model/locale.js';
import { TransactionListItem } from './TransactionListItem.js';
import { TransactionListGroup } from './TransactionListGroup.js';

export class TransactionList extends TestComponent {
    async parseContent() {
        const res = {
            items: [],
            noDataMessage: { elem: await query(this.elem, '.nodata-message') },
        };

        const props = await evaluate((elem) => ({
            renderTime: elem.dataset.time,
            details: elem.classList.contains('trans-list_details'),
            isSelectMode: elem.classList.contains('list_select'),
            isSortMode: elem.classList.contains('list_sort'),
        }), this.elem);
        res.renderTime = props.renderTime;
        res.details = props.details;

        if (props.isSelectMode) {
            res.listMode = 'select';
        } else if (props.isSortMode) {
            res.listMode = 'sort';
        } else {
            res.listMode = 'list';
        }

        const groupElems = await queryAll(this.elem, '.trans-group');

        res.groups = await asyncMap(
            groupElems,
            (item) => TransactionListGroup.create(this.parent, item),
        );

        const listItems = await queryAll(this.elem, '.trans-item');
        if (listItems.length === 0) {
            return res;
        }

        res.items = await asyncMap(
            listItems,
            (item) => TransactionListItem.create(this.parent, item),
        );

        return res;
    }

    get items() {
        return this.content.items;
    }

    get groups() {
        return this.content.groups;
    }

    get listMode() {
        return this.content.listMode;
    }

    getItemData(item) {
        assert(item, 'Invalid item');

        return {
            id: item.id,
            selected: item.content.selected,
            amountText: item.content.amountText,
            accountTitle: item.content.accountTitle,
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

    static render(transactions, state, showDate = true) {
        assert.isArray(transactions);

        return {
            items: transactions.map((item) => TransactionListItem.render(item, state, showDate)),
            noDataMessage: { visible: transactions.length === 0 },
        };
    }

    static renderWidget(transactions, state) {
        assert.isArray(transactions, 'Invalid data');

        const res = {
            title: __('transactions.listTitle'),
            transList: this.render(transactions, state, true),
        };

        return res;
    }
}
