import { AppComponent } from '../AppComponent.js';

export class Widget extends AppComponent {
    async parseContent() {
        if (!this.elem || !await this.hasClass(this.elem, 'widget')) {
            throw new Error('Wrong widget structure');
        }

        const res = {
            titleElem: await this.query(this.elem, '.widget_title'),
            linkElem: await this.query(this.elem, '.widget_title > a'),
            textElem: await this.query(this.elem, '.widget_title span'),
        };

        if (res.linkElem) {
            res.link = await this.prop(res.linkElem, 'href');
        }
        if (res.textElem) {
            res.title = await this.prop(res.textElem, 'textContent');
        }

        return res;
    }

    async clickByTitle() {
        await this.click(this.content.linkElem);
    }
}
