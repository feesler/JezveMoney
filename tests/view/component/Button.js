import { AppComponent } from './AppComponent.js';

export class Button extends AppComponent {
    async parseContent() {
        const res = {
            btnElem: await this.query(this.elem, ':scope > *'),
        };
        if (!res.btnElem) {
            throw new Error('Invalid button component');
        }

        return res;
    }

    async click() {
        return this.environment.click(this.content.btnElem);
    }
}
