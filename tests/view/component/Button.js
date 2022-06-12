import { TestComponent, query, click } from 'jezve-test';

export class Button extends TestComponent {
    async parseContent() {
        const res = {
            btnElem: await query(this.elem, ':scope > *'),
        };
        if (!res.btnElem) {
            throw new Error('Invalid button component');
        }

        return res;
    }

    async click() {
        return click(this.content.btnElem);
    }
}
