import { Component } from './component.js';

export class MenuItem extends Component {
    async parse() {
        if (!this.elem) {
            throw new Error('Wrong structure of menu item');
        }

        const typeId = await this.prop(this.elem, 'dataset.type');
        this.type = parseInt(typeId, 10);
        if (Number.isNaN(this.type)) {
            throw new Error(`Invalid transaction type ${typeId}`);
        }

        this.titleElem = await this.query(this.elem, '.trtype-menu_item_title');
        this.text = await this.prop(this.titleElem, 'textContent');

        this.isActive = await this.hasClass(this.elem, 'trtype-menu__item_selected');

        this.checkElem = await this.query(this.elem, '.trtype-menu__item-check');
        this.linkElem = await this.query(this.elem, 'a');
        this.link = await this.prop(this.linkElem, 'href');
    }

    async toggle() {
        if (!this.checkElem) {
            throw new Error('Check not available');
        }

        await this.environment.click(this.checkElem);
    }

    async click() {
        await this.environment.click(this.linkElem);
    }
}
