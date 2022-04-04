import { AppComponent } from './AppComponent.js';

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

        res.success = await this.hasClass(this.elem, 'msg_success')
            && !(await this.hasClass(this.elem, 'msg_error'));

        res.messageElem = await this.query(this.elem, '.popup__message');
        if (!res.messageElem) {
            throw new Error('Wrong structure of message popup');
        }

        res.message = await this.prop(res.messageElem, 'textContent');
        res.message = res.message.trim();
        res.closeBtn = await this.query(this.elem, '.close-btn');

        if (!res.success) {
            console.log(`Error popup appear: ${res.message}`);
        }

        return res;
    }

    async close() {
        return this.click(this.content.closeBtn);
    }
}
