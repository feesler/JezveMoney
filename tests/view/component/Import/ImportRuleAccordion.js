import {
    query,
    click,
    assert,
} from 'jezve-test';
import { Collapsible } from 'jezvejs-test';

export class ImportRuleAccordion extends Collapsible {
    async parseContent() {
        const res = await super.parseContent();

        res.createBtn = await query(this.elem, '.collapsible-header .create-btn');

        assert(res.createBtn, 'Invalid structure of import rule accordion');

        return res;
    }

    async create() {
        await click(this.content.createBtn);
    }
}
