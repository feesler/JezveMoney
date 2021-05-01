import { TestComponent } from 'jezve-test';

export class MessagePopup extends TestComponent {
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

    async parse() {
        this.success = await this.hasClass(this.elem, 'msg_success')
            && !(await this.hasClass(this.elem, 'msg_error'));

        this.messageElem = await this.query(this.elem, '.popup__message');
        if (!this.messageElem) {
            throw new Error('Wrong structure of message popup');
        }

        this.message = await this.prop(this.messageElem, 'textContent');
        this.message = this.message.trim();
        this.closeBtn = await this.query(this.elem, '.close-btn');

        if (!this.success) {
            console.log(`Error popup appear: ${this.message}`);
        }
    }

    async close() {
        return this.click(this.closeBtn);
    }
}
