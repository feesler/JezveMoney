import { AppComponent } from './AppComponent.js';
import { query, prop, click } from '../../env.js';

export class TileInfoItem extends AppComponent {
    async parseContent() {
        const res = {};

        res.titleElem = await query(this.elem, ':scope > *');
        if (!res.titleElem) {
            throw new Error('Title element not found');
        }
        res.title = await prop(res.titleElem, 'textContent');

        res.buttonElem = await query(this.elem, 'button');
        if (!res.buttonElem) {
            throw new Error('Button element not found');
        }
        const buttonInner = await query(res.buttonElem, 'span');
        if (!buttonInner) {
            throw new Error('Wrong structure of tile info block');
        }
        res.value = await prop(buttonInner, 'textContent');

        return res;
    }

    async click() {
        return click(this.content.buttonElem);
    }
}
