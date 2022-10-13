import {
    TestComponent,
    assert,
    query,
    isVisible,
} from 'jezve-test';
import { IconButton } from './IconButton.js';
import { InputRow } from './InputRow.js';

export class CommentRow extends TestComponent {
    async parseContent() {
        const res = {};

        const iconBtnElem = await query(this.elem, '.iconbutton');

        res.iconBtn = await IconButton.create(this.parent, iconBtnElem);
        assert(res.iconBtn, 'Icon button of comment not found');

        res.inputRow = await InputRow.create(
            this.parent,
            await query(this.elem, '#comment_block'),
        );
        assert(res.inputRow, 'Input row of comment not found');

        res.value = res.inputRow.content.value;

        return res;
    }

    async input(val) {
        if (await isVisible(this.content.iconBtn.elem)) {
            await this.content.iconBtn.click();
        }

        return this.content.inputRow.input(val);
    }
}
