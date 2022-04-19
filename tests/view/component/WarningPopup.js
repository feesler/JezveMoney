import { AppComponent } from './AppComponent.js';
import { query, prop } from '../../env.js';

export class WarningPopup extends AppComponent {
    async parseContent() {
        const res = {
            titleElem: await query(this.elem, '.popup__title'),
            title: await prop(this.titleElem, 'textContent'),
            messageElem: await query(this.elem, '.popup__message > div'),
            message: await prop(this.messageElem, 'textContent'),
            okBtn: await query(this.elem, '.popup__controls > .btn.submit-btn'),
            cancelBtn: await query(this.elem, '.popup__controls > .btn.cancel-btn'),
        };

        return res;
    }
}
