import { AppComponent } from '../AppComponent.js';
import {
    query,
    hasClass,
    prop,
    click,
} from '../../../env.js';

export class ImportRuleAccordion extends AppComponent {
    async parseContent() {
        if (!this.elem) {
            throw new Error('Invalid import rule accordion element');
        }

        const res = {
            collapsed: !(await hasClass(this.elem, 'collapsible__expanded')),
            headerElem: await query(this.elem, '.collapsible-header'),
            labelElem: await query(this.elem, '.collapsible-header label'),
            createBtn: await query(this.elem, '.collapsible-header .create-btn'),
            toggleBtn: await query(this.elem, '.collapsible-header .toggle-btn'),
            contentElem: await query(this.elem, '.collapsible-content'),
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

        res.title = await prop(res.labelElem, 'textContent');

        return res;
    }

    isCollapsed() {
        return this.content.collapsed;
    }

    async toggle() {
        await click(this.content.headerElem);
    }

    async create() {
        await click(this.content.createBtn);
    }
}
