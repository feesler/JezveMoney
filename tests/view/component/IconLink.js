import { AppComponent } from './AppComponent.js';

export class IconLink extends AppComponent {
    async parseContent() {
        if (!this.elem) {
            return {};
        }

        if (!await this.hasClass(this.elem, 'iconlink')) {
            throw new Error('Wrong icon link');
        }

        const res = {
            linkElem: await this.query(this.elem, ':scope > *'),
        };

        if (!res.linkElem) {
            throw new Error('Link element not found');
        }

        const tagName = await this.prop(res.linkElem, 'tagName');
        if (tagName === 'A') {
            res.link = await this.prop(res.linkElem, 'href');
        }

        res.titleElem = await this.query(res.linkElem, '.iconlink__content');
        const titleInner = await this.query(res.titleElem, ':scope > *');
        if (!titleInner) {
            throw new Error('Title element not found');
        }
        res.title = await this.prop(titleInner, 'textContent');

        // Subtitle is optional
        res.subTitleElem = await this.query(res.titleElem, '.iconlink__subtitle');
        if (res.subTitleElem) {
            res.subtitle = await this.prop(res.subTitleElem, 'textContent');
        }

        return res;
    }

    async click() {
        return this.environment.click(this.content.linkElem);
    }
}
