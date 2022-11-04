import {
    TestComponent,
    assert,
    query,
    queryAll,
    hasClass,
    isVisible,
    copyObject,
} from 'jezve-test';
import { Paginator } from 'jezvejs-test';
import { ImportTransactionForm } from './ImportTransactionForm.js';
import { ImportTransactionItem } from './ImportTransactionItem.js';
import { asyncMap } from '../../../common.js';

export class ImportList extends TestComponent {
    constructor(parent, elem, mainAccount) {
        super(parent, elem);

        this.mainAccount = mainAccount;
    }

    async parseContent() {
        const res = {
            items: [],
        };
        const isSelectMode = await hasClass(this.elem, 'import-list_select');
        const isSortMode = await hasClass(this.elem, 'import-list_sort');
        if (isSelectMode) {
            res.listMode = 'select';
        } else if (isSortMode) {
            res.listMode = 'sort';
        } else {
            res.listMode = 'list';
        }

        const listItems = await queryAll(this.elem, '.import-form,.import-item');
        if (listItems) {
            res.items = await asyncMap(
                listItems,
                async (item) => {
                    const isForm = await hasClass(item, 'import-form');
                    const ListItemClass = (isForm) ? ImportTransactionForm : ImportTransactionItem;
                    return ListItemClass.create(this.parent, item, this.mainAccount);
                },
            );

            res.paginator = await Paginator.create(this, await query(this.elem, '.paginator'));
        } else {
            const noDataMsg = await query(this.elem, '.nodata-message');
            const visible = await isVisible(noDataMsg);
            assert(visible, 'No data message is not visible');
        }

        res.loadingIndicator = { elem: await query(this.elem, '.loading-indicator') };

        return res;
    }

    get listMode() {
        return this.content.listMode;
    }

    get items() {
        return this.content.items;
    }

    get paginator() {
        return this.content.paginator;
    }

    async buildModel(cont) {
        const res = {
            items: [],
            pagination: {
                page: (cont.paginator) ? cont.paginator.active : 1,
                pages: (cont.paginator) ? cont.paginator.pages : 1,
            },
            invalidated: false,
            formIndex: -1,
            contextMenuIndex: -1,
            isLoading: cont.loadingIndicator.visible,
        };

        cont.items.forEach((item, index) => {
            res.items.push(this.getItemData(item));
            res.invalidated = res.invalidated || item.model.invalidated;
            if (item.model.isContextMenu) {
                assert(res.contextMenuIndex === -1, 'Invalid state: two or more context menus');
                res.contextMenuIndex = index;
            }

            if (item.content.isForm) {
                assert(res.formIndex === -1, 'Invalid state: two or more Import transaction forms');

                res.formIndex = index;
            }
        });

        return res;
    }

    getPagination() {
        return {
            ...this.model.pagination,
        };
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
        const res = {
            items: this.content.items.map((item) => {
                // TODO : don't use copyObject
                const listItem = (item.model.isForm)
                    ? ImportTransactionForm.getExpectedState(item.model)
                    : ImportTransactionItem.getExpectedState(item.model);
                return copyObject(listItem);
            }),
        };

        return res;
    }

    static render(transactions, state, formIndex = -1) {
        assert.isArray(transactions, 'Invalid data');

        return {
            items: transactions.map((item, index) => (
                (formIndex === index)
                    ? ImportTransactionForm.render(item, state)
                    : ImportTransactionItem.render(item, state)
            )),
        };
    }
}
