import { Component } from './component.js';

export class Button extends Component {
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
