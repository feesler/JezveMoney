import {
    TestComponent,
    assert,
    query,
    prop,
    hasClass,
} from 'jezve-test';

export class Counter extends TestComponent {
    async parseContent() {
        const validClass = await hasClass(this.elem, 'counter');
        assert(validClass, 'Invalid structure of counter');

        const res = {
            titleElem: await query(this.elem, '.counter__title'),
            valueElem: await query(this.elem, '.counter__value'),
        };
        assert(res.titleElem && res.valueElem, 'Invalid structure of counter');

        res.title = await prop(res.titleElem, 'textContent');
        res.value = await prop(res.valueElem, 'textContent');
        res.value = parseInt(res.value, 10);

        return res;
    }
}
