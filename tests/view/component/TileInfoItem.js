import {
    TestComponent,
    assert,
    query,
    prop,
    click,
} from 'jezve-test';

export class TileInfoItem extends TestComponent {
    async parseContent() {
        const res = {};

        res.titleElem = await query(this.elem, ':scope > *');
        assert(res.titleElem, 'Title element not found');
        res.title = await prop(res.titleElem, 'textContent');

        res.buttonElem = await query(this.elem, 'button');
        assert(res.buttonElem, 'Button element not found');
        const buttonInner = await query(res.buttonElem, 'span');
        assert(buttonInner, 'Wrong structure of tile info block');
        res.value = await prop(buttonInner, 'textContent');

        return res;
    }

    async click() {
        return click(this.content.buttonElem);
    }
}
