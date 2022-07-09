import {
    query,
    click,
    assert,
} from 'jezve-test';
import { Collapsible } from 'jezvejs/tests';

export class FiltersAccordion extends Collapsible {
    async parseContent() {
        const res = await super.parseContent();

        res.clearAllBtn = await query(this.elem, '.collapsible-header .clear-all-btn');
        assert(res.clearAllBtn, 'Invalid structure of filters accordion');

        return res;
    }

    async clearAll() {
        await click(this.content.clearAllBtn);
    }
}
