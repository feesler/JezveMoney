import {
    TestComponent,
    assert,
    query,
    queryAll,
    prop,
    navigation,
    click,
    wait,
} from 'jezve-test';
import { AppView } from './AppView.js';
import { LoginView } from './LoginView.js';
import { App } from '../Application.js';
import { WarningPopup } from './component/WarningPopup.js';
import { InputRow } from './component/InputRow.js';

// Profile view class
export class ProfileView extends AppView {
    async parseContent() {
        const res = {};

        const blocks = await queryAll('.content_wrap > .profile_block');
        assert(blocks.length === 4, 'Invalid profile view structure');

        res.loginElem = await query(blocks[0], 'span');
        res.nameElem = await query('#namestatic');
        res.nameLinkElem = await query(blocks[1], 'div > a');
        res.changePassLinkElem = await query(blocks[2], 'div > a');
        assert(
            res.loginElem
            && res.nameElem
            && res.nameLinkElem
            && res.changePassLinkElem,
            'Invalid profile view structure',
        );

        res.login = await prop(res.loginElem, 'textContent');
        res.name = await prop(res.nameElem, 'textContent');

        const buttons = await queryAll(blocks[3], 'input[type="button"]');
        assert(buttons?.length === 3, 'Invalid profile view structure');

        [res.resetBtn, res.resetAllBtn, res.deleteProfileBtn] = buttons;

        res.changeNamePopup = {
            elem: await query('#chname_popup'),
            content: await query('#changename'),
            newNameInp: await InputRow.create(this, await query('#name-inp-block')),
        };

        if (res.changeNamePopup.elem) {
            res.changeNamePopup.okBtn = await query(res.changeNamePopup.elem, '.popup__controls > input.btn.submit-btn');
            res.changeNamePopup.closeBtn = await query(res.changeNamePopup.elem, '.close-btn');
        }

        res.changePassPopup = {
            elem: await query('#chpass_popup'),
            content: await query('#changepass'),
            oldPassInp: await InputRow.create(this, await query('#old-pwd-inp-block')),
            newPassInp: await InputRow.create(this, await query('#new-pwd-inp-block')),
        };

        if (res.changePassPopup.elem) {
            res.changePassPopup.okBtn = await query(
                res.changePassPopup.elem,
                '.popup__controls > input.btn.submit-btn',
            );
            res.changePassPopup.closeBtn = await query(res.changePassPopup.elem, '.close-btn');
        }

        res.reset_warning = await WarningPopup.create(this, await query('#reset_warning'));
        res.reset_all_warning = await WarningPopup.create(this, await query('#reset_all_warning'));
        res.delete_warning = await WarningPopup.create(this, await query('#delete_warning'));

        return res;
    }

    async changeName(newName) {
        await this.performAction(() => click(this.content.nameLinkElem));
        await this.performAction(() => wait('.popup__content.chname_popup', { visible: true }));

        assert(this.content.changeNamePopup?.visible, 'Change name popup not appear');

        const validInput = (newName && newName !== this.content.name && newName.length > 0);

        await this.performAction(() => this.content.changeNamePopup.newNameInp.input(newName));
        await this.performAction(() => click(this.content.changeNamePopup.okBtn));

        if (validInput) {
            await this.performAction(() => wait('.popup__content.msg', { visible: true }));
        } else {
            await this.performAction(() => click(this.content.changeNamePopup.closeBtn));
        }
    }

    async changePassword(oldPass, newPass) {
        await this.performAction(() => click(this.content.changePassLinkElem));
        await this.performAction(() => wait('.popup__content.chpass_popup', { visible: true }));

        assert(this.content.changePassPopup?.visible, 'Change password popup not appear');

        const validInput = (
            oldPass
            && oldPass.length > 0
            && newPass
            && newPass.length > 0
            && oldPass !== newPass
        );

        await this.performAction(() => this.content.changePassPopup.oldPassInp.input(oldPass));
        await this.performAction(() => this.content.changePassPopup.newPassInp.input(newPass));
        await this.performAction(() => click(this.content.changePassPopup.okBtn));

        if (validInput) {
            await this.performAction(() => wait('.popup__content.msg', { visible: true }));
        } else {
            await this.performAction(() => click(this.content.changePassPopup.closeBtn));
        }
    }

    async resetAccounts() {
        assert(this.content.resetBtn, 'Reset accounts button not found');

        await this.performAction(() => click(this.content.resetBtn));

        assert(this.content.reset_warning?.content?.visible, 'Warning popup not appear');
        assert(this.content.reset_warning.content.okBtn, 'Confirm button not found');

        await navigation(() => click(this.content.reset_warning.content.okBtn));
    }

    async resetAll() {
        assert(this.content.resetAllBtn, 'Reset all button not found');

        await this.performAction(() => click(this.content.resetAllBtn));

        assert(this.content.reset_all_warning?.content?.visible, 'Warning popup not appear');
        assert(this.content.reset_all_warning.content.okBtn, 'Confirm button not found');

        await navigation(() => click(this.content.reset_all_warning.content.okBtn));
    }

    async deleteProfile() {
        assert(this.content.deleteProfileBtn, 'Delete button not found');

        await this.performAction(() => click(this.content.deleteProfileBtn));

        const warningVisible = await TestComponent.isVisible(this.content.delete_warning);
        assert(warningVisible, 'Warning popup not appear');
        assert(this.content.delete_warning.content.okBtn, 'Confirm button not found');

        await navigation(() => click(this.content.delete_warning.content.okBtn));
        assert.instanceOf(App.view, LoginView, 'Unexpected page');
    }
}
