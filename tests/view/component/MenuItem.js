import { AppComponent } from './AppComponent.js';

export class MenuItem extends AppComponent {
    async parseContent() {
        if (!this.elem) {
            throw new Error('Wrong structure of menu item');
        }

        const res = {};

        const typeId = await this.prop(this.elem, 'dataset.type');
        res.type = parseInt(typeId, 10);
        if (Number.isNaN(res.type)) {
            throw new Error(`Invalid transaction type ${typeId}`);
        }

        res.titleElem = await this.query(this.elem, '.trtype-menu_item_title');
        res.text = await this.prop(res.titleElem, 'textContent');

        res.isActive = await this.hasClass(this.elem, 'trtype-menu__item_selected');

        res.checkElem = await this.query(this.elem, '.trtype-menu__item-check');
        res.linkElem = await this.query(this.elem, 'a');
        res.link = await this.prop(res.linkElem, 'href');

        return res;
    }

    async toggle() {
        if (!this.content.checkElem) {
            throw new Error('Check not available');
        }

        await this.environment.click(this.content.checkElem);
    }

    async click() {
        await this.environment.click(this.content.linkElem);
    }
}
