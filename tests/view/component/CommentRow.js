import { AppComponent } from './AppComponent.js';
import { IconLink } from './IconLink.js';
import { InputRow } from './InputRow.js';

export class CommentRow extends AppComponent {
    async parseContent() {
        const res = {};

        const iconLinkElem = await this.query(this.elem, '.iconlink');

        res.iconLink = await IconLink.create(this.parent, iconLinkElem);
        if (!res.iconLink) {
            throw new Error('Iconlink of comment not found');
        }

        res.inputRow = await InputRow.create(
            this.parent,
            await this.query(this.elem, '#comment_block'),
        );
        if (!res.inputRow) {
            throw new Error('Input row of comment not found');
        }

        res.value = res.inputRow.content.value;

        return res;
    }

    async input(val) {
        if (await this.isVisible(this.content.iconLink.elem)) {
            await this.content.iconLink.click();
        }

        return this.content.inputRow.input(val);
    }
}
