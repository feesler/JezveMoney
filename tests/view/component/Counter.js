import { assert } from '@jezvejs/assert';
import { TestComponent, evaluate } from 'jezve-test';

/** Counter component */
export class Counter extends TestComponent {
    async parseContent() {
        assert(this.elem, 'Invalid counter element');

        const res = await evaluate((el) => {
            if (!el?.classList?.contains('counter')) {
                return null;
            }
            const titleEl = el.firstElementChild;
            const valueEl = titleEl?.nextElementSibling;

            return {
                title: titleEl?.textContent,
                value: valueEl?.textContent,
            };
        }, this.elem);

        return res;
    }
}
