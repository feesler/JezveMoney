import { AppComponent } from '../AppComponent.js';
import {
    query,
    hasClass,
    prop,
    click,
} from '../../../env.js';

export class Widget extends AppComponent {
    async parseContent() {
        if (!this.elem || !await hasClass(this.elem, 'widget')) {
            throw new Error('Wrong widget structure');
        }

        const res = {
            titleElem: await query(this.elem, '.widget_title'),
            linkElem: await query(this.elem, '.widget_title > a'),
            textElem: await query(this.elem, '.widget_title span'),
        };

        if (res.linkElem) {
            res.link = await prop(res.linkElem, 'href');
        }
        if (res.textElem) {
            res.title = await prop(res.textElem, 'textContent');
        }

        return res;
    }

    async clickByTitle() {
        await click(this.content.linkElem);
    }
}
