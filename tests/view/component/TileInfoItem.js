import { TestComponent } from 'jezve-test';

export class TileInfoItem extends TestComponent {
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
