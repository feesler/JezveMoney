import { TestComponent, copyObject } from 'jezve-test';
import { ImportListItem } from './ImportListItem.js';
import { asyncMap } from '../../../common.js';

export class ImportList extends TestComponent {
    constructor(parent, elem, mainAccount) {
        super(parent, elem);

        this.mainAccount = mainAccount;

        this.model = {};
    }

    async parse() {
        this.items = [];
        this.invalidated = false;

        const listItems = await this.queryAll(this.elem, '.import-item');
        if (listItems) {
            this.items = await asyncMap(
                listItems,
                (item) => ImportListItem.create(this.parent, item, this.mainAccount),
            );
            this.invalidated = this.items.some((item) => item.model.invalidated);
        } else {
            const noDataMsg = await this.query(this.elem, '.nodata-message');
            const visible = await this.isVisible(noDataMsg);
            if (!visible) {
                throw new Error('No data message is not visible');
            }
        }

        const loadingIndicator = await this.query(this.elem, '.data-container__loading');
        this.isLoading = await this.isVisible(loadingIndicator);
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
