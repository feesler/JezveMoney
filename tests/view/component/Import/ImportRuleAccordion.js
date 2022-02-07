import { AppComponent } from '../AppComponent.js';

export class ImportRuleAccordion extends AppComponent {
    async parseContent() {
        if (!this.elem) {
            throw new Error('Invalid import rule accordion element');
        }

        const res = {
            collapsed: !(await this.hasClass(this.elem, 'collapsible__expanded')),
            headerElem: await this.query(this.elem, '.collapsible-header'),
            labelElem: await this.query(this.elem, '.collapsible-header label'),
            createBtn: await this.query(this.elem, '.collapsible-header .create-btn'),
            toggleBtn: await this.query(this.elem, '.collapsible-header .toggle-btn'),
            contentElem: await this.query(this.elem, '.collapsible-content'),
        };

        if (
            !res.headerElem
            || !res.labelElem
            || !res.createBtn
            || !res.toggleBtn
            || !res.contentElem
        ) {
            throw new Error('Invalid structure of import rule accordion');
        }

        res.title = await this.prop(res.labelElem, 'textContent');

        return res;
    }

    isCollapsed() {
        return this.content.collapsed;
    }

    async toggle() {
        await this.click(this.content.headerElem);
    }

    async create() {
        await this.click(this.content.createBtn);
    }
}
