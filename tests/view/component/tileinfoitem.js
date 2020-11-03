import { Component } from './component.js';

export class TileInfoItem extends Component {
    async parse() {
        this.titleElem = await this.query(this.elem, ':scope > *');
        if (!this.titleElem) {
            throw new Error('Title element not found');
        }
        this.title = await this.prop(this.titleElem, 'textContent');

        this.buttonElem = await this.query(this.elem, 'button');
        if (!this.buttonElem) {
            throw new Error('Button element not found');
        }
        const buttonInner = await this.query(this.buttonElem, 'span');
        if (!buttonInner) {
            throw new Error('Wrong structure of tile info block');
        }
        this.value = await this.prop(buttonInner, 'textContent');
    }

    async click() {
        return this.environment.click(this.buttonElem);
    }
}
