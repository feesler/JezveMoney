import { assert } from '@jezvejs/assert';
import {
    query,
    click,
    prop,
} from 'jezve-test';
import { Collapsible } from 'jezvejs-test';

export class ImportRuleAccordion extends Collapsible {
    async parseContent() {
        const res = await super.parseContent();

        res.title = await prop(res.header.elem, 'textContent');
        res.title = res.title?.trim();

        res.createBtn = await query(this.elem, '.collapsible-header .create-btn');
        assert(res.createBtn, 'Invalid structure of import rule accordion');

        return res;
    }

    get items() {
        return this.content.items;
    }

    async create() {
        await click(this.content.createBtn);
    }
}
