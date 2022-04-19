import { AppComponent } from './AppComponent.js';
import {
    query,
    prop,
    hasClass,
    click,
} from '../../env.js';

export class IconLink extends AppComponent {
    async parseContent() {
        if (!this.elem) {
            return {};
        }

        if (!await hasClass(this.elem, 'iconlink')) {
            throw new Error('Wrong icon link');
        }

        const res = {
            linkElem: await query(this.elem, ':scope > *'),
        };

        if (!res.linkElem) {
            throw new Error('Link element not found');
        }

        const tagName = await prop(res.linkElem, 'tagName');
        if (tagName === 'A') {
            res.link = await prop(res.linkElem, 'href');
        }

        res.titleElem = await query(res.linkElem, '.iconlink__content');
        const titleInner = await query(res.titleElem, ':scope > *');
        if (!titleInner) {
            throw new Error('Title element not found');
        }
        res.title = await prop(titleInner, 'textContent');

        // Subtitle is optional
        res.subTitleElem = await query(res.titleElem, '.iconlink__subtitle');
        if (res.subTitleElem) {
            res.subtitle = await prop(res.subTitleElem, 'textContent');
        }

        return res;
    }

    async click() {
        return click(this.content.linkElem);
    }
}
