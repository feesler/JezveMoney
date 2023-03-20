import {
    TestComponent,
    assert,
    query,
    hasClass,
    click,
    evaluate,
} from 'jezve-test';

export class CurrencyItem extends TestComponent {
    static render(currency) {
        assert(currency, 'Invalid currency');

        return {
            title: currency.name,
        };
    }

    async parseContent() {
        const validClass = await hasClass(this.elem, 'currency-item');
        assert(validClass, 'Invalid currency item element');

        const titleElem = await query(this.elem, '.currency-item__title');
        assert(titleElem, 'Title element not found');

        const res = await evaluate((elem, titleEl) => ({
            id: parseInt(elem.dataset.id, 10),
            title: titleEl.textContent,
            selected: elem.classList.contains('currency-item_selected'),
        }), this.elem, titleElem);

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
