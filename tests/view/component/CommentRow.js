import {
    TestComponent,
    assert,
    query,
    isVisible,
} from 'jezve-test';
import { IconLink } from './IconLink.js';
import { InputRow } from './InputRow.js';

export class CommentRow extends TestComponent {
    async parseContent() {
        const res = {};

        const iconLinkElem = await query(this.elem, '.iconlink');

        res.iconLink = await IconLink.create(this.parent, iconLinkElem);
        assert(res.iconLink, 'Iconlink of comment not found');

        res.inputRow = await InputRow.create(
            this.parent,
            await query(this.elem, '#comment_block'),
        );
        assert(res.inputRow, 'Input row of comment not found');

        res.value = res.inputRow.content.value;

        return res;
    }

    async input(val) {
        if (await isVisible(this.content.iconLink.elem)) {
            await this.content.iconLink.click();
        }

        return this.content.inputRow.input(val);
    }
}
