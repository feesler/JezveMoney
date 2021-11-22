import { copyObject } from 'jezvejs';
import { AppComponent } from '../AppComponent.js';
import { ImportListItem } from './ImportListItem.js';
import { asyncMap } from '../../../common.js';

export class ImportList extends AppComponent {
    constructor(parent, elem, mainAccount) {
        super(parent, elem);

        this.mainAccount = mainAccount;
    }

    async parseContent() {
        const res = {
            items: [],
            invalidated: false,
        };

        const listItems = await this.queryAll(this.elem, '.import-item');
        if (listItems) {
            res.items = await asyncMap(
                listItems,
                (item) => ImportListItem.create(this.parent, item, this.mainAccount),
            );
        } else {
            const noDataMsg = await this.query(this.elem, '.nodata-message');
            const visible = await this.isVisible(noDataMsg);
            if (!visible) {
                throw new Error('No data message is not visible');
            }
        }

        res.loadingIndicator = await this.query(this.elem, '.data-container__loading');

        return res;
    }

    async buildModel(cont) {
        const res = {
            items: cont.items.map((item) => this.getItemData(item)),
            invalidated: cont.items.some((item) => item.model.invalidated),
            isLoading: await this.isVisible(cont.loadingIndicator),
        };

        return res;
    }

    getItem(index) {
        const ind = parseInt(index, 10);
        if (Number.isNaN(ind) || ind < 0 || ind >= this.content.items.length) {
            throw new Error(`Invalid index of item: ${index}`);
        }

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
