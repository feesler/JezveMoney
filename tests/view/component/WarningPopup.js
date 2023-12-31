import { assert } from '@jezvejs/assert';
import {
    TestComponent,
    click,
    query,
    evaluate,
} from 'jezve-test';

export class WarningPopup extends TestComponent {
    async parseContent() {
        const res = {
            titleElem: await query(this.elem, '.popup__title'),
            messageElem: await query(this.elem, '.popup__message > div'),
            okBtn: await query(this.elem, '.popup__footer .submit-btn'),
            cancelBtn: await query(this.elem, '.popup__footer .cancel-btn'),
        };

        [res.title, res.message] = await evaluate((titleEl, msgEl) => ([
            titleEl?.textContent,
            msgEl?.textContent,
        ]), this.titleElem, this.messageElem);

        return res;
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
