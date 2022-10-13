import { TestComponent, query, assert } from 'jezve-test';
import { IconButton } from './IconButton.js';

export class Toolbar extends TestComponent {
    async parseContent() {
        if (!this.elem) {
            return {};
        }

        const res = {
            buttons: {},
        };

        res.editBtn = await IconButton.create(this, await query('#edit_btn'));
        if (res.editBtn) {
            res.buttons.update = res.editBtn;
        }

        res.exportBtn = await IconButton.create(this, await query('#export_btn'));
        if (res.exportBtn) {
            res.buttons.export = res.exportBtn;
        }

        res.delBtn = await IconButton.create(this, await query('#del_btn'));
        if (res.delBtn) {
            res.buttons.del = res.delBtn;
        }

        res.showBtn = await IconButton.create(this, await query('#show_btn'));
        if (res.showBtn) {
            res.buttons.show = res.showBtn;
        }

        res.hideBtn = await IconButton.create(this, await query('#hide_btn'));
        if (res.hideBtn) {
            res.buttons.hide = res.hideBtn;
        }

        return res;
    }

    getItemByName(name) {
        const key = name.toLowerCase();
        if (!(key in this.content.buttons)) {
            return null;
        }

        return this.content.buttons[key];
    }

    isButtonVisible(name) {
        const button = this.getItemByName(name);
        return button?.content?.visible;
    }

    async clickButton(name) {
        const button = this.getItemByName(name);
        assert(button, `Button ${name} not found`);
        assert(button?.content?.visible, `Button ${name} not visible`);

        return button.click();
    }

    getButtonLink(name) {
        const button = this.getItemByName(name);
        assert(button, `Button ${name} not found`);

        return button.content.link;
    }
}
