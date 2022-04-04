import { AppComponent } from './AppComponent.js';

export class TileInfoItem extends AppComponent {
    async parseContent() {
        const res = {};

        res.titleElem = await this.query(this.elem, ':scope > *');
        if (!res.titleElem) {
            throw new Error('Title element not found');
        }
        res.title = await this.prop(res.titleElem, 'textContent');

        res.buttonElem = await this.query(this.elem, 'button');
        if (!res.buttonElem) {
            throw new Error('Button element not found');
        }
        const buttonInner = await this.query(res.buttonElem, 'span');
        if (!buttonInner) {
            throw new Error('Wrong structure of tile info block');
        }
        res.value = await this.prop(buttonInner, 'textContent');

        return res;
    }

    async click() {
        return this.environment.click(this.content.buttonElem);
    }
}
