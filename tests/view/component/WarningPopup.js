import { AppComponent } from './AppComponent.js';

export class WarningPopup extends AppComponent {
    async parseContent() {
        const res = {
            titleElem: await this.query(this.elem, '.popup__title'),
            title: await this.prop(this.titleElem, 'textContent'),
            messageElem: await this.query(this.elem, '.popup__message > div'),
            message: await this.prop(this.messageElem, 'textContent'),
            okBtn: await this.query(this.elem, '.popup__controls > .btn.submit-btn'),
            cancelBtn: await this.query(this.elem, '.popup__controls > .btn.cancel-btn'),
        };

        return res;
    }
}
