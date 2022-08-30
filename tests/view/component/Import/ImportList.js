import {
    TestComponent,
    assert,
    query,
    queryAll,
    isVisible,
    copyObject,
} from 'jezve-test';
import { ImportTransactionForm } from './ImportTransactionForm.js';
import { asyncMap } from '../../../common.js';

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

        const listItems = await queryAll(this.elem, '.import-form');
        if (listItems) {
            res.items = await asyncMap(
                listItems,
                (item) => ImportTransactionForm.create(this.parent, item, this.mainAccount),
            );
        } else {
            const noDataMsg = await query(this.elem, '.nodata-message');
            const visible = await isVisible(noDataMsg);
            assert(visible, 'No data message is not visible');
        }

        res.loadingIndicator = { elem: await query(this.elem, '.loading-indicator') };

        return res;
    }

    async buildModel(cont) {
        const res = {
            items: cont.items.map((item) => this.getItemData(item)),
            invalidated: cont.items.some((item) => item.model.invalidated),
            isLoading: cont.loadingIndicator.visible,
        };

        return res;
    }

    getItem(index) {
        const ind = parseInt(index, 10);
        assert.arrayIndex(this.content.items, ind);

        return this.content.items[ind];
    }

    getItemData(item) {
        assert(item, 'Invalid item');

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
                (item) => copyObject(item.getExpectedState(item.model)),
            ),
        };
    }

    static render(transactions, state) {
        assert.isArray(transactions, 'Invalid data');

        return {
            items: transactions.map((item) => ImportTransactionForm.render(item, state)),
        };
    }
}
