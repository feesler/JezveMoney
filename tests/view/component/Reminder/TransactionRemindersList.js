import { assert } from '@jezvejs/assert';
import {
    TestComponent,
    query,
    queryAll,
    evaluate,
    asyncMap,
} from 'jezve-test';
import { RemindersListItem } from './RemindersListItem.js';

export class TransactionRemindersList extends TestComponent {
    static render(data, state) {
        assert.isArray(data);

        return {
            items: data.map((item) => RemindersListItem.render(item, state)),
            noDataMessage: { visible: data.length === 0 },
        };
    }

    async parseContent() {
        const res = {
            items: [],
            noDataMessage: { elem: await query(this.elem, '.nodata-message') },
        };

        const props = await evaluate((elem) => ({
            renderTime: elem.dataset.time,
            details: elem.classList.contains('reminder-list_details'),
            isSelectMode: elem.classList.contains('list_select'),
        }), this.elem);
        res.renderTime = props.renderTime;
        res.details = props.details;

        if (props.isSelectMode) {
            res.listMode = 'select';
        } else {
            res.listMode = 'list';
        }

        const listItems = await queryAll(this.elem, '.reminder-item');
        if (listItems.length === 0) {
            return res;
        }

        res.items = await asyncMap(
            listItems,
            (item) => RemindersListItem.create(this.parent, item),
        );

        return res;
    }

    get items() {
        return this.content.items;
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
}
