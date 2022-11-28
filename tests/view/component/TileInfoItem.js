import {
    TestComponent,
    assert,
    query,
    click,
    evaluate,
} from 'jezve-test';

export class TileInfoItem extends TestComponent {
    async parseContent() {
        const res = {};

        res.titleElem = await query(this.elem, 'span');
        assert(res.titleElem, 'Title element not found');

        res.buttonElem = await query(this.elem, 'button');
        assert(res.buttonElem, 'Button element not found');

        [
            res.title,
            res.value,
        ] = await evaluate((titleEl, btn) => ([
            titleEl.textContent,
            btn.textContent,
        ]), res.titleElem, res.buttonElem);

        return res;
    }

    async click() {
        return click(this.content.buttonElem);
    }
}
