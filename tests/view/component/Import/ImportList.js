import { copyObject } from 'jezvejs';
import { TestComponent } from 'jezve-test';
import { ImportListItem } from './ImportListItem.js';
import { asyncMap } from '../../../common.js';
import { assert } from '../../../assert.js';
import { query, queryAll, isVisible } from '../../../env.js';

export class ImportList extends TestComponent {
    constructor(parent, elem, mainAccount) {
        super(parent, elem);

        this.mainAccount = mainAccount;
    }

    async parseContent() {
        const res = {
            items: [],
            invalidated: false,
        };

        const listItems = await queryAll(this.elem, '.import-item');
        if (listItems) {
            res.items = await asyncMap(
                listItems,
                (item) => ImportListItem.create(this.parent, item, this.mainAccount),
            );
        } else {
            const noDataMsg = await query(this.elem, '.nodata-message');
            const visible = await isVisible(noDataMsg);
            if (!visible) {
                throw new Error('No data message is not visible');
            }
        }

        res.loadingIndicator = await query(this.elem, '.data-container__loading');

        return res;
    }

    async buildModel(cont) {
        const res = {
            items: cont.items.map((item) => this.getItemData(item)),
            invalidated: cont.items.some((item) => item.model.invalidated),
            isLoading: await isVisible(cont.loadingIndicator),
        };

        return res;
    }

    getItem(index) {
        const ind = parseInt(index, 10);
        assert.arrayIndex(this.content.items, ind);

        return this.content.items[ind];
    }

    getItemData(item) {
        if (!item) {
            throw new Error('Invalid item');
        }

        const res = copyObject(item.data);

        return res;
    }

    getItems() {
        return this.content.items.map((item) => this.getItemData(item));
    }

    getEnabledItems() {
        return this.content.items.filter((item) => item.model.enabled);
    }

    getExpectedState() {
        return {
            items: this.content.items.map(
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
