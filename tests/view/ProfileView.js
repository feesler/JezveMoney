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
import { Checkbox } from 'jezvejs/tests';
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
        assert(buttons?.length === 2, 'Invalid profile view structure');

        [res.resetBtn, res.deleteProfileBtn] = buttons;

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

        res.resetDataPopup = {
            elem: await query('#reset_popup'),
            content: await query('#reset'),
            resetAllCheck: await Checkbox.create(this, await query('#resetAllCheck')),
            accountsCheck: await Checkbox.create(this, await query('#accountsCheck')),
            personsCheck: await Checkbox.create(this, await query('#personsCheck')),
            transactionsCheck: await Checkbox.create(this, await query('#transactionsCheck')),
            keepAccountsBalanceCheck: await Checkbox.create(this, await query('#keepAccountsBalanceCheck')),
            importTemplatesCheck: await Checkbox.create(this, await query('#importTemplatesCheck')),
            importRulesCheck: await Checkbox.create(this, await query('#importRulesCheck')),
        };

        if (res.resetDataPopup.elem) {
            res.resetDataPopup.okBtn = await query(
                res.resetDataPopup.elem,
                '.popup__controls > input.btn.submit-btn',
            );
            res.resetDataPopup.closeBtn = await query(res.resetDataPopup.elem, '.close-btn');
        }

        res.reset_warning = await WarningPopup.create(this, await query('#reset_warning'));
        res.delete_warning = await WarningPopup.create(this, await query('#delete_warning'));

        return res;
    }

    async changeName(newName) {
        await this.performAction(() => click(this.content.nameLinkElem));
        await this.performAction(() => wait('.popup.chname_popup', { visible: true }));

        assert(this.content.changeNamePopup?.visible, 'Change name popup not appear');

        const validInput = (newName && newName !== this.content.name && newName.length > 0);

        await this.performAction(() => this.content.changeNamePopup.newNameInp.input(newName));
        await this.performAction(() => click(this.content.changeNamePopup.okBtn));

        if (validInput) {
            await this.performAction(() => wait('.popup.msg', { visible: true }));
        } else {
            await this.performAction(() => click(this.content.changeNamePopup.closeBtn));
        }
    }

    async changePassword(oldPass, newPass) {
        await this.performAction(() => click(this.content.changePassLinkElem));
        await this.performAction(() => wait('.popup.chpass_popup', { visible: true }));

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
            await this.performAction(() => wait('.popup.msg', { visible: true }));
        } else {
            await this.performAction(() => click(this.content.changePassPopup.closeBtn));
        }
    }

    async resetData(options = {}) {
        assert(this.content.resetBtn, 'Reset button not found');

        await this.performAction(() => click(this.content.resetBtn));

        assert(this.content.resetDataPopup?.visible, 'Change password popup not appear');

        // Deselect all options
        await this.performAction(() => this.content.resetDataPopup.resetAllCheck.toggle());
        if (this.content.resetDataPopup.resetAllCheck.checked) {
            await this.performAction(() => this.content.resetDataPopup.resetAllCheck.toggle());
        }

        const { accountsCheck } = this.content.resetDataPopup;
        if (('accounts' in options) && !accountsCheck.checked) {
            await this.performAction(() => accountsCheck.toggle());
        }

        const { personsCheck } = this.content.resetDataPopup;
        if (('persons' in options) && !personsCheck.checked) {
            await this.performAction(() => personsCheck.toggle());
        }

        const { transactionsCheck } = this.content.resetDataPopup;
        if (('transactions' in options) && !transactionsCheck.checked) {
            await this.performAction(() => transactionsCheck.toggle());
        }

        const { keepAccountsBalanceCheck } = this.content.resetDataPopup;
        if (('keepbalance' in options) && !keepAccountsBalanceCheck.checked) {
            assert(!keepAccountsBalanceCheck.disabled, 'Keep accounts balance checkbox is disabled');
            await this.performAction(() => keepAccountsBalanceCheck.toggle());
        }

        const { importTemplatesCheck } = this.content.resetDataPopup;
        if (('importtpl' in options) && !importTemplatesCheck.checked) {
            await this.performAction(() => importTemplatesCheck.toggle());
        }

        const { importRulesCheck } = this.content.resetDataPopup;
        if (('importrules' in options) && !importRulesCheck.checked) {
            await this.performAction(() => importRulesCheck.toggle());
        }

        await this.performAction(async () => {
            await click(this.content.resetDataPopup.okBtn);
            await wait('.popup.msg', { visible: true });
        });
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
