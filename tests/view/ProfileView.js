import {
    assert,
    query,
    queryAll,
    prop,
    navigation,
    click,
    wait,
} from 'jezve-test';
import { Checkbox } from 'jezvejs-test';
import { AppView } from './AppView.js';
import { LoginView } from './LoginView.js';
import { App } from '../Application.js';
import { WarningPopup } from './component/WarningPopup.js';
import { InputField } from './component/Fields/InputField.js';

// Profile view class
export class ProfileView extends AppView {
    async parseContent() {
        const res = {};

        const blocks = await queryAll('main .profile-block');
        assert(blocks.length === 4, 'Invalid profile view structure');

        res.loginElem = await query(blocks[0], 'span');
        res.userNameTitle = await query('#userNameTitle');
        res.nameLinkElem = await query('#changeNameBtn');
        res.changePassLinkElem = await query('#changePassBtn');
        res.resetLinkElem = await query('#resetBtn');
        res.deleteProfileBtn = await query('#delProfileBtn');
        assert(
            res.loginElem
            && res.userNameTitle
            && res.nameLinkElem
            && res.changePassLinkElem
            && res.resetLinkElem,
            'Invalid profile view structure',
        );

        res.login = await prop(res.loginElem, 'textContent');
        res.name = await prop(res.userNameTitle, 'textContent');

        res.changeNamePopup = {
            elem: await query('#chname_popup'),
            content: await query('#changename'),
            newNameInp: await InputField.create(this, await query('#nameField')),
        };

        if (res.changeNamePopup.elem) {
            res.changeNamePopup.okBtn = await query(res.changeNamePopup.elem, '.form-controls .submit-btn');
            res.changeNamePopup.closeBtn = await query(res.changeNamePopup.elem, '.close-btn');
        }

        res.changePassPopup = {
            elem: await query('#chpass_popup'),
            content: await query('#changepass'),
            oldPassInp: await InputField.create(this, await query('#oldPassField')),
            newPassInp: await InputField.create(this, await query('#newPassField')),
        };

        if (res.changePassPopup.elem) {
            res.changePassPopup.okBtn = await query(res.changePassPopup.elem, '.form-controls .submit-btn');
            res.changePassPopup.closeBtn = await query(res.changePassPopup.elem, '.close-btn');
        }

        res.resetDataPopup = {
            elem: await query('#reset_popup'),
            content: await query('#reset'),
            resetAllCheck: await Checkbox.create(this, await query('#resetAllCheck')),
            accountsCheck: await Checkbox.create(this, await query('#accountsCheck')),
            personsCheck: await Checkbox.create(this, await query('#personsCheck')),
            transactionsCheck: await Checkbox.create(this, await query('#transactionsCheck')),
            keepBalanceCheck: await Checkbox.create(this, await query('#keepBalanceCheck')),
            scheduleCheck: await Checkbox.create(this, await query('#scheduleCheck')),
            importTplCheck: await Checkbox.create(this, await query('#importTplCheck')),
            importRulesCheck: await Checkbox.create(this, await query('#importRulesCheck')),
        };

        if (res.resetDataPopup.elem) {
            res.resetDataPopup.okBtn = await query(res.resetDataPopup.elem, '.form-controls .submit-btn');
            res.resetDataPopup.closeBtn = await query(res.resetDataPopup.elem, '.close-btn');
        }

        res.delete_warning = await WarningPopup.create(this, await query('#delete_warning'));

        return res;
    }

    async changeName(newName) {
        await this.performAction(() => click(this.content.nameLinkElem));
        await this.performAction(() => wait('.popup.name-dialog', { visible: true }));

        assert(this.content.changeNamePopup?.visible, 'Change name popup not appear');

        const validInput = (newName && newName.length > 0);
        const nameChanged = newName !== App.state.profile.name;

        await this.performAction(() => this.content.changeNamePopup.newNameInp.input(newName));
        await this.performAction(() => click(this.content.changeNamePopup.okBtn));

        if (validInput) {
            if (nameChanged) {
                await this.performAction(() => wait('.popup.notification', { visible: true }));
            }
        } else {
            await this.performAction(() => click(this.content.changeNamePopup.closeBtn));
        }
    }

    async changePassword(oldPass, newPass) {
        await this.performAction(() => click(this.content.changePassLinkElem));
        await this.performAction(() => wait('.popup.password-dialog', { visible: true }));

        assert(this.content.changePassPopup?.visible, 'Change password popup not appear');

        const validInput = (
            oldPass?.length > 0
            && newPass?.length > 0
            && oldPass !== newPass
        );

        await this.performAction(() => this.content.changePassPopup.oldPassInp.input(oldPass));
        await this.performAction(() => this.content.changePassPopup.newPassInp.input(newPass));
        await this.performAction(() => click(this.content.changePassPopup.okBtn));

        if (validInput) {
            await this.performAction(() => wait('.popup.notification', { visible: true }));
        } else {
            await this.performAction(() => click(this.content.changePassPopup.closeBtn));
        }
    }

    async resetData(options = {}) {
        assert(this.content.resetLinkElem, 'Reset button not found');

        await this.performAction(() => click(this.content.resetLinkElem));

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

        const { keepBalanceCheck } = this.content.resetDataPopup;
        if (('keepbalance' in options) && !keepBalanceCheck.checked) {
            assert(!keepBalanceCheck.disabled, 'Keep accounts balance checkbox is disabled');
            await this.performAction(() => keepBalanceCheck.toggle());
        }

        const { scheduleCheck } = this.content.resetDataPopup;
        if (('schedule' in options) && !scheduleCheck.checked) {
            await this.performAction(() => scheduleCheck.toggle());
        }

        const { importTplCheck } = this.content.resetDataPopup;
        if (('importtpl' in options) && !importTplCheck.checked) {
            await this.performAction(() => importTplCheck.toggle());
        }

        const { importRulesCheck } = this.content.resetDataPopup;
        if (('importrules' in options) && !importRulesCheck.checked) {
            await this.performAction(() => importRulesCheck.toggle());
        }

        await this.performAction(async () => {
            await click(this.content.resetDataPopup.okBtn);
            await wait('.popup.notification', { visible: true });
        });
    }

    async deleteProfile() {
        assert(this.content.deleteProfileBtn, 'Delete button not found');

        await this.performAction(() => click(this.content.deleteProfileBtn));

        const warningVisible = this.content.delete_warning?.content?.visible;
        assert(warningVisible, 'Warning popup not appear');

        await navigation(() => this.content.delete_warning.clickOk());
        assert.instanceOf(App.view, LoginView, 'Unexpected page');
    }
}
