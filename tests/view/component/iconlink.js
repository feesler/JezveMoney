import { Component } from './component.js';

export class IconLink extends Component {
    async parse() {
        if (!this.elem) {
            return;
        }

        if (!await this.hasClass(this.elem, 'iconlink')) {
            throw new Error('Wrong icon link');
        }

        this.linkElem = await this.query(this.elem, ':scope > *');
        if (!this.linkElem) {
            throw new Error('Link element not found');
        }

        const tagName = await this.prop(this.linkElem, 'tagName');
        if (tagName === 'A') {
            this.link = await this.prop(this.linkElem, 'href');
        }

        this.titleElem = await this.query(this.linkElem, '.iconlink__content');
        const titleInner = await this.query(this.titleElem, ':scope > *');
        if (!titleInner) {
            throw new Error('Title element not found');
        }
        this.title = await this.prop(titleInner, 'textContent');

        // Subtitle is optional
        this.subTitleElem = await this.query(this.titleElem, '.iconlink__subtitle');
        if (this.subTitleElem) {
            this.subtitle = await this.prop(this.subTitleElem, 'textContent');
        }
    }

    async click() {
        return this.environment.click(this.linkElem);
    }
}
