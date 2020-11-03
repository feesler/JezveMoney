import { Component } from './component.js';

export class WarningPopup extends Component {
    async parse() {
        this.titleElem = await this.query(this.elem, '.popup__title');
        this.title = await this.prop(this.titleElem, 'textContent');
        this.messageElem = await this.query(this.elem, '.popup__message > div');
        this.message = await this.prop(this.messageElem, 'textContent');
        this.okBtn = await this.query(this.elem, '.popup__controls > .btn.submit-btn');
        this.cancelBtn = await this.query(this.elem, '.popup__controls > .btn.cancel-btn');
    }
}
