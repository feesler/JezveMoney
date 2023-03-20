import {
    TestComponent,
    assert,
    query,
    queryAll,
    copyObject,
    asyncMap,
    evaluate,
} from 'jezve-test';
import { CurrencyItem } from './CurrencyItem.js';

export class CurrenciesList extends TestComponent {
    static render(transactions, state) {
        assert.isArray(transactions, 'Invalid data');

        return {
            items: transactions.map((item) => (
                CurrencyItem.render(item, state)
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

    async parseContent() {
        const res = {
            mode: 'list',
            items: [],
        };

        const [
            renderTime,
            isSelectMode,
            isSortMode,
        ] = await evaluate((el) => ([
            parseInt(el?.dataset?.time, 10),
            el?.classList?.contains('currencies-list_select'),
            el?.classList?.contains('currencies-list_sort'),
        ]), this.elem);

        res.renderTime = renderTime;

        if (isSelectMode) {
            res.mode = 'select';
        } else if (isSortMode) {
            res.mode = 'sort';
        }

        const listItems = await queryAll(this.elem, '.currency-item');
        res.items = await asyncMap(
            listItems,
            (item) => CurrencyItem.create(this, item),
        );

        return res;
    }

    get mode() {
        return this.content.mode;
    }

    get items() {
        return this.content.items;
    }

    get renderTime() {
        return this.content.renderTime;
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
}
