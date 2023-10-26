import { assert } from '@jezvejs/assert';
import {
    TestComponent,
    query,
    click,
    evaluate,
} from 'jezve-test';

export class Notification extends TestComponent {
    static async create(...args) {
        if (args.length < 2 || !args[1]) {
            return null;
        }

        let instance;
        try {
            instance = new this(...args);
            if (!await TestComponent.isVisible(instance)) {
                return null;
            }

            await instance.parse();
        } catch (e) {
            return null;
        }

        return instance;
    }

    async parseContent() {
        const res = {
            closeBtn: { elem: await query(this.elem, '.close-btn') },
        };
        assert(res.closeBtn.elem, 'Close button not found');

        const messageElem = await query(this.elem, '.popup__message');
        assert(messageElem, 'Message element not found');

        [
            res.success,
            res.message,
        ] = await evaluate((el, msgEl) => ([
            el.classList.contains('success') && !el.classList.contains('error'),
            msgEl.textContent.trim(),
        ]), this.elem, messageElem);

        return res;
    }

    async close() {
        return click(this.content.closeBtn.elem);
    }
}
