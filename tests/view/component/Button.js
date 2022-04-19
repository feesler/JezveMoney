import { AppComponent } from './AppComponent.js';
import { query, click } from '../../env.js';

export class Button extends AppComponent {
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
