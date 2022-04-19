import { AppComponent } from './AppComponent.js';
import {
    query,
    prop,
    hasClass,
    click,
} from '../../env.js';

export class MessagePopup extends AppComponent {
    static async create(...args) {
        if (args.length < 2 || !args[1]) {
            return null;
        }

        let instance;
        try {
            instance = new this(...args);
            if (!await AppComponent.isVisible(instance)) {
                return null;
            }

            await instance.parse();
        } catch (e) {
            return null;
        }

        return instance;
    }

    async parseContent() {
        const res = {};

        res.success = await hasClass(this.elem, 'msg_success')
            && !(await hasClass(this.elem, 'msg_error'));

        res.messageElem = await query(this.elem, '.popup__message');
        if (!res.messageElem) {
            throw new Error('Wrong structure of message popup');
        }

        res.message = await prop(res.messageElem, 'textContent');
        res.message = res.message.trim();
        res.closeBtn = await query(this.elem, '.close-btn');

        if (!res.success) {
            console.log(`Error popup appear: ${res.message}`);
        }

        return res;
    }

    async close() {
        return click(this.content.closeBtn);
    }
}
