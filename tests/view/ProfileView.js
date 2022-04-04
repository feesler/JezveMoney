import { AppComponent } from './component/AppComponent.js';
import { AppView } from './AppView.js';
import { LoginView } from './LoginView.js';
import { App } from '../Application.js';
import { WarningPopup } from './component/WarningPopup.js';
import { InputRow } from './component/InputRow.js';

// Profile view class
export class ProfileView extends AppView {
    async parseContent() {
        const res = {};

        const blocks = await this.queryAll('.content_wrap > .profile_block');
        if (blocks.length !== 4) {
            throw new Error('Invalid profile view structure');
        }

        res.loginElem = await this.query(blocks[0], 'span');
        res.nameElem = await this.query('#namestatic');
        res.nameLinkElem = await this.query(blocks[1], 'div > a');
        res.changePassLinkElem = await this.query(blocks[2], 'div > a');
        if (!res.loginElem || !res.nameElem || !res.nameLinkElem || !res.changePassLinkElem) {
            throw new Error('Invalid profile view structure');
        }

        res.login = await this.prop(res.loginElem, 'textContent');
        res.name = await this.prop(res.nameElem, 'textContent');

        const buttons = await this.queryAll(blocks[3], 'input[type="button"]');
        if (!buttons || buttons.length !== 3) {
            throw new Error('Invalid profile view structure');
        }
        [res.resetBtn, res.resetAllBtn, res.deleteProfileBtn] = buttons;

        res.changeNamePopup = {
            elem: await this.query('#chname_popup'),
            content: await this.query('#changename'),
            newNameInp: await InputRow.create(this, await this.query('#name-inp-block')),
        };

        if (res.changeNamePopup.elem) {
            res.changeNamePopup.okBtn = await this.query(res.changeNamePopup.elem, '.popup__controls > input.btn.submit-btn');
            res.changeNamePopup.closeBtn = await this.query(res.changeNamePopup.elem, '.close-btn');
        }

        res.changePassPopup = {
            elem: await this.query('#chpass_popup'),
            content: await this.query('#changepass'),
            oldPassInp: await InputRow.create(this, await this.query('#old-pwd-inp-block')),
            newPassInp: await InputRow.create(this, await this.query('#new-pwd-inp-block')),
        };

        if (res.changePassPopup.elem) {
            res.changePassPopup.okBtn = await this.query(
                res.changePassPopup.elem,
                '.popup__controls > input.btn.submit-btn',
            );
            res.changePassPopup.closeBtn = await this.query(res.changePassPopup.elem, '.close-btn');
        }

        res.reset_warning = await WarningPopup.create(this, await this.query('#reset_warning'));
        res.reset_all_warning = await WarningPopup.create(this, await this.query('#reset_all_warning'));
        res.delete_warning = await WarningPopup.create(this, await this.query('#delete_warning'));

        return res;
    }

    async changeName(newName) {
        await this.performAction(() => this.click(this.content.nameLinkElem));

        await this.performAction(() => this.wait('.popup__content.chname_popup', { visible: true }));

        if (
            !this.content.changeNamePopup
            || !(await this.isVisible(this.content.changeNamePopup.elem))
        ) {
            throw new Error('Change name popup not appear');
        }

        const validInput = (newName && newName !== this.content.name && newName.length > 0);

        await this.performAction(() => this.content.changeNamePopup.newNameInp.input(newName));
        await this.performAction(() => this.click(this.content.changeNamePopup.okBtn));

        if (validInput) {
            await this.performAction(() => this.wait('.popup__content.msg', { visible: true }));
        } else {
            await this.performAction(() => this.click(this.content.changeNamePopup.closeBtn));
        }
    }

    async changePassword(oldPass, newPass) {
        await this.performAction(() => this.click(this.content.changePassLinkElem));
        await this.performAction(() => this.wait('.popup__content.chpass_popup', { visible: true }));

        if (
            !this.content.changePassPopup
            || !(await this.isVisible(this.content.changePassPopup.elem))
        ) {
            throw new Error('Change password popup not appear');
        }

        const validInput = (
            oldPass
            && oldPass.length > 0
            && newPass
            && newPass.length > 0
            && oldPass !== newPass
        );

        await this.performAction(() => this.content.changePassPopup.oldPassInp.input(oldPass));
        await this.performAction(() => this.content.changePassPopup.newPassInp.input(newPass));
        await this.performAction(() => this.click(this.content.changePassPopup.okBtn));

        if (validInput) {
            await this.performAction(() => this.wait('.popup__content.msg', { visible: true }));
        } else {
            await this.performAction(() => this.click(this.content.changePassPopup.closeBtn));
        }
    }

    async resetAccounts() {
        if (!this.content.resetBtn) {
            throw new Error('Reset accounts button not found');
        }

        await this.performAction(() => this.click(this.content.resetBtn));

        if (!await AppComponent.isVisible(this.content.reset_warning)) {
            throw new Error('Warning popup not appear');
        }
        if (!this.content.reset_warning.content.okBtn) {
            throw new Error('Confirm button not found');
        }

        await this.navigation(() => this.click(this.content.reset_warning.content.okBtn));
    }

    async resetAll() {
        if (!this.content.resetAllBtn) {
            throw new Error('Reset all button not found');
        }

        await this.performAction(() => this.click(this.content.resetAllBtn));

        if (!await AppComponent.isVisible(this.content.reset_all_warning)) {
            throw new Error('Warning popup not appear');
        }
        if (!this.content.reset_all_warning.content.okBtn) {
            throw new Error('Confirm button not found');
        }

        await this.navigation(() => this.click(this.content.reset_all_warning.content.okBtn));
    }

    async deleteProfile() {
        if (!this.content.deleteProfileBtn) {
            throw new Error('Delete button not found');
        }

        await this.performAction(() => this.click(this.content.deleteProfileBtn));

        if (!await AppComponent.isVisible(this.content.delete_warning)) {
            throw new Error('Warning popup not appear');
        }
        if (!this.content.delete_warning.content.okBtn) {
            throw new Error('Confirm button not found');
        }

        await this.navigation(() => this.click(this.content.delete_warning.content.okBtn));
        if (!(App.view instanceof LoginView)) {
            throw new Error('Unexpected page');
        }
    }
}
