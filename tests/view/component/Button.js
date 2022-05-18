import { TestComponent } from 'jezve-test';
import { query, click } from '../../env.js';

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
