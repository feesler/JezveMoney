import {
    TestComponent,
    assert,
    queryAll,
    asyncMap,
    evaluate,
} from 'jezve-test';
import { App } from '../../../Application.js';
import { Currency } from '../../../model/Currency.js';
import { CurrencyItem } from './CurrencyItem.js';

/**
 * User currencies list test component
 */
export class CurrenciesList extends TestComponent {
    static getExpectedState(model, state = App.state) {
        assert(model, 'Invalid model');
        assert.isArray(model.items, 'Invalid currencies');

        return {
            mode: model.mode,
            items: model.items.map((item) => {
                if (!item.id) {
                    return item;
                }

                const userCurrency = state.userCurrencies.getItem(item.id);
                const currency = App.currency.getItem(userCurrency?.curr_id);
                assert(currency, 'Invalid user currency item');

                const expectedItem = new Currency({
                    ...item,
                    ...currency,
                });

                return CurrencyItem.getExpectedState(expectedItem, state);
            }),
        };
    }

    static async getListMode(elem) {
        if (!elem) {
            return null;
        }

        const { selectMode, sortMode } = await evaluate((el) => ({
            selectMode: el.classList.contains('list_select'),
            sortMode: el.classList.contains('list_sort'),
        }), elem);

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
            el?.classList?.contains('list_select'),
            el?.classList?.contains('list_sort'),
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

        const res = structuredClone(item.data);

        return res;
    }

    getItems() {
        return this.content.items.map((item) => this.getItemData(item));
    }
}
