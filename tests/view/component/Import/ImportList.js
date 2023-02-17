import {
    TestComponent,
    assert,
    query,
    queryAll,
    copyObject,
    asyncMap,
    evaluate,
} from 'jezve-test';
import { Paginator } from 'jezvejs-test';
import { App } from '../../../Application.js';
import { ImportTransactionItem } from './ImportTransactionItem.js';

export class ImportList extends TestComponent {
    static render(transactions, state) {
        assert.isArray(transactions, 'Invalid data');

        return {
            items: transactions.map((item) => (
                ImportTransactionItem.render(item, state)
            )),
        };
    }

    static async getListMode(elem) {
        if (!elem) {
            return null;
        }
        const dataContainer = await query(elem, '.import-list');
        if (!dataContainer) {
            return null;
        }

        const { selectMode, sortMode } = await evaluate((el) => ({
            selectMode: el.classList.contains('import-list_select'),
            sortMode: el.classList.contains('import-list_sort'),
        }), dataContainer);

        if (selectMode) {
            return 'select';
        }
        return (sortMode) ? 'sort' : 'list';
    }

    constructor(parent, elem, mainAccount) {
        super(parent, elem);

        this.mainAccount = mainAccount;
    }

    async parseContent() {
        const res = {
            listMode: await ImportList.getListMode(this.elem),
            items: [],
        };

        res.items = await asyncMap(
            await queryAll(this.elem, '.import-item'),
            (item) => ImportTransactionItem.create(this.parent, item, this.mainAccount),
        );

        res.showMoreBtn = { elem: await query(this.elem, '.show-more-btn') };
        res.paginator = await Paginator.create(this, await query(this.elem, '.paginator'));
        res.noDataMsg = { elem: await query(this.elem, '.nodata-message') };
        res.loadingIndicator = { elem: await query(this.elem, '.loading-indicator') };

        return res;
    }

    get listMode() {
        return this.content.listMode;
    }

    get items() {
        return this.content.items;
    }

    get showMoreBtn() {
        return this.content.showMoreBtn;
    }

    get noDataMsg() {
        return this.content.noDataMsg;
    }

    get paginator() {
        return this.content.paginator;
    }

    buildModel(cont) {
        const paginatorVisible = cont.paginator?.content?.visible;

        const itemsOnPage = App.config.importTransactionsOnPage;
        const range = Math.ceil(cont.items.length / itemsOnPage);
        const pagination = (paginatorVisible)
            ? {
                page: cont.paginator.active - range + 1,
                pages: cont.paginator.pages,
                range,
            } : {
                page: 1,
                pages: 1,
                range: 1,
            };

        const res = {
            items: [],
            pagination,
            invalidated: false,
            formIndex: -1,
            contextMenuIndex: -1,
            isLoading: cont.loadingIndicator.visible,
        };

        cont.items.forEach((item, index) => {
            res.items.push(this.getItemData(item));
            if (item.model.isContextMenu) {
                assert(res.contextMenuIndex === -1, 'Invalid state: two or more context menus');
                res.contextMenuIndex = index;
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
}
