import { assert } from '@jezvejs/assert';
import {
    TestComponent,
    click,
    query,
    evaluate,
} from 'jezve-test';
import { Checkbox } from 'jezvejs-test';

export class DeleteCategoryDialog extends TestComponent {
    async parseContent() {
        const res = {
            titleElem: await query(this.elem, '.popup__title'),
            messageElem: await query(this.elem, '.popup__message .confirm-message'),
            deleteChildsCheck: await Checkbox.create(this, await query(this.elem, '.checkbox')),
            okBtn: await query(this.elem, '.popup__footer .submit-btn'),
            cancelBtn: await query(this.elem, '.popup__footer .cancel-btn'),
        };

        [res.title, res.message] = await evaluate((titleEl, msgEl) => ([
            titleEl?.textContent,
            msgEl?.textContent,
        ]), this.titleElem, this.messageElem);

        return res;
    }

    get removeChildren() {
        return this.content.deleteChildsCheck.checked;
    }

    async toggleDeleteChilds() {
        assert(this.content.deleteChildsCheck?.content?.visible, 'Delete children checkbox not visible or not found');
        return this.content.deleteChildsCheck.toggle();
    }

    async clickOk() {
        assert(this.content.okBtn, 'Ok button not found');
        return click(this.content.okBtn);
    }

    async clickCancel() {
        assert(this.content.cancelBtn, 'Cancel button not found');
        return click(this.content.cancelBtn);
    }
}
