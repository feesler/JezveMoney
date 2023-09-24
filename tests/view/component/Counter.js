import { TestComponent, assert, evaluate } from 'jezve-test';

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
                value: parseInt(valueEl?.textContent, 10),
            };
        }, this.elem);

        return res;
    }
}
