import {
    TestComponent,
    assert,
    query,
    hasClass,
    evaluate,
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

        [
            res.title,
            res.value,
        ] = await evaluate((titleEl, valueEl) => ([
            titleEl.textContent,
            parseInt(valueEl.textContent, 10),
        ]), res.titleElem, res.valueElem);

        return res;
    }
}
