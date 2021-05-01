import { TestComponent } from 'jezve-test';

export class Button extends TestComponent {
    async parse() {
        this.btnElem = await this.query(this.elem, ':scope > *');
        if (!this.btnElem) {
            throw new Error('Invalid button component');
        }
    }

    async click() {
        return this.environment.click(this.btnElem);
    }
}
