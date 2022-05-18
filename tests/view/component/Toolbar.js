import { TestComponent } from 'jezve-test';
import { IconLink } from './IconLink.js';
import { query, isVisible } from '../../env.js';

export class Toolbar extends TestComponent {
    async parseContent() {
        if (!this.elem) {
            return {};
        }

        const res = {
            buttons: {},
        };

        res.editBtn = await IconLink.create(this, await query('#edit_btn'));
        if (res.editBtn) {
            res.buttons.update = res.editBtn;
        }

        res.exportBtn = await IconLink.create(this, await query('#export_btn'));
        if (res.exportBtn) {
            res.buttons.export = res.exportBtn;
        }

        res.delBtn = await IconLink.create(this, await query('#del_btn'));
        if (res.delBtn) {
            res.buttons.del = res.delBtn;
        }

        res.showBtn = await IconLink.create(this, await query('#show_btn'));
        if (res.showBtn) {
            res.buttons.show = res.showBtn;
        }

        res.hideBtn = await IconLink.create(this, await query('#hide_btn'));
        if (res.hideBtn) {
            res.buttons.hide = res.hideBtn;
        }

        return res;
    }

    async checkVisibility(button) {
        if (!button) {
            return false;
        }

        return isVisible(button.elem);
    }

    getItemByName(name) {
        const key = name.toLowerCase();
        if (!(key in this.content.buttons)) {
            return null;
        }

        return this.content.buttons[key];
    }

    async isButtonVisible(name) {
        return this.checkVisibility(this.getItemByName(name));
    }

    async clickButton(name) {
        const button = this.getItemByName(name);
        if (!button) {
            throw new Error(`Button ${name} not found`);
        }

        if (!await this.checkVisibility(button)) {
            throw new Error(`Button ${name} not visible`);
        }

        return button.click();
    }

    getButtonLink(name) {
        const button = this.getItemByName(name);
        if (!button) {
            throw new Error(`Button ${name} not found`);
        }

        return button.content.link;
    }
}
