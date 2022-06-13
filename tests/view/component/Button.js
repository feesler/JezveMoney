import {
    TestComponent,
    assert,
    query,
    click,
} from 'jezve-test';

export class Button extends TestComponent {
    async parseContent() {
        const res = {
            btnElem: await query(this.elem, ':scope > *'),
        };
        assert(res.btnElem, 'Invalid button component');

        return res;
    }

    async click() {
        return click(this.content.btnElem);
    }
}
