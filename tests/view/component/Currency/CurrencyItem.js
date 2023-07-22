import {
    TestComponent,
    assert,
    query,
    click,
    evaluate,
} from 'jezve-test';
import { App } from '../../../Application.js';
import { Currency } from '../../../model/Currency.js';

export class CurrencyItem extends TestComponent {
    static getExpectedState(currency) {
        assert.instanceOf(currency, Currency, 'Invalid currency');

        const res = {
            title: currency.formatName(App.view.locale),
        };

        if (currency.selected) {
            res.selected = true;
        }

        return res;
    }

    async parseContent() {
        assert(this.elem, 'Invalid currency item element');

        const res = await evaluate((el) => {
            if (!el?.classList?.contains('currency-item')) {
                return null;
            }

            const titleEl = el.querySelector('.currency-item__title');

            return {
                id: parseInt(el.dataset.id, 10),
                title: titleEl?.textContent,
                selected: el.classList.contains('list-item_selected'),
            };
        }, this.elem);
        assert(res, 'Invalid currency item element');

        res.menuBtn = await query(this.elem, '.menu-btn');

        return res;
    }

    buildModel(cont) {
        return {
            id: cont.id,
            title: cont.title,
            selected: cont.selected,
        };
    }

    async click() {
        return click(this.elem);
    }

    async clickMenu() {
        return click(this.content.menuBtn);
    }
}
