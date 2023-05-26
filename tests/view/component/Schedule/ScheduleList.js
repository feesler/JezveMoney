import {
    TestComponent,
    query,
    queryAll,
    assert,
    evaluate,
    asyncMap,
} from 'jezve-test';
import { ScheduleListItem } from './ScheduleListItem.js';

export class ScheduleList extends TestComponent {
    static render(data, state, options) {
        assert.isArray(data);

        return {
            items: data.map((item) => ScheduleListItem.render(item, state, options)),
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
            details: elem.classList.contains('schedule-list_details'),
            isSelectMode: elem.classList.contains('schedule-list_select'),
        }), this.elem);
        res.renderTime = props.renderTime;
        res.details = props.details;

        if (props.isSelectMode) {
            res.listMode = 'select';
        } else {
            res.listMode = 'list';
        }

        const listItems = await queryAll(this.elem, '.schedule-item');
        if (listItems.length === 0) {
            return res;
        }

        res.items = await asyncMap(
            listItems,
            (item) => ScheduleListItem.create(this.parent, item),
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
            dateRange: item.content.dateRange,
            interval: item.content.interval,
            offset: item.content.offset,
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
