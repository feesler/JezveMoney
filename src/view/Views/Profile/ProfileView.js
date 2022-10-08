import 'jezvejs/style';
import {
    ge,
    show,
    setEvents,
} from 'jezvejs';
import { Checkbox } from 'jezvejs/Checkbox';
import { Popup } from 'jezvejs/Popup';
import { Application } from '../../js/Application.js';
import { View } from '../../js/View.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import '../../css/app.scss';
import './style.scss';
import { API } from '../../js/api/index.js';

/** Strings */
const TITLE_PROFILE_DELETE = 'Delete profile';
const MSG_PROFILE_DELETE = 'Are you sure to completely delete your profile?<br>This operation can not be undone.';

/**
 * User profile view
 */
class ProfileView extends View {
    /** View initialization */
    onStart() {
        this.changeNamePopup = null;
        this.changePassPopup = null;
        this.resetPopup = null;

        this.nameElem = ge('namestatic');
        this.changeNameBtn = ge('changeNameBtn');
        this.changePassBtn = ge('changePassBtn');
        this.resetBtn = ge('resetBtn');
        this.delProfileBtn = ge('delProfileBtn');
        if (
            !this.nameElem
            || !this.changeNameBtn
            || !this.changePassBtn
            || !this.resetBtn
            || !this.delProfileBtn
        ) {
            throw new Error('Failed to initialize Profile view');
        }

        setEvents(this.changeNameBtn, { click: (e) => this.showChangeNamePopup(e) });
        setEvents(this.changePassBtn, { click: (e) => this.showChangePasswordPopup(e) });
        setEvents(this.resetBtn, { click: () => this.showResetPopup() });
        setEvents(this.delProfileBtn, { click: () => this.confirmDelete() });

        // Change name dialog
        this.changeNameContent = ge('changename');
        this.changeNameForm = this.changeNameContent?.querySelector('form');
        if (!this.changeNameContent || !this.changeNameForm) {
            throw new Error('Failed to initialize Change name form');
        }
        setEvents(this.changeNameForm, { submit: (e) => this.onChangeNameSubmit(e) });

        // Change password dialog
        this.changePassContent = ge('changepass');
        this.changePassForm = this.changePassContent?.querySelector('form');
        if (!this.changePassContent || !this.changePassForm) {
            throw new Error('Failed to initialize Change password form');
        }
        setEvents(this.changePassForm, { submit: (e) => this.onChangePassSubmit(e) });

        // Reset data dialog
        this.resetContent = ge('reset');
        this.resetForm = this.resetContent?.querySelector('form');
        if (!this.resetContent || !this.resetForm) {
            throw new Error('Failed to initialize Reset data form');
        }
        setEvents(this.resetForm, { submit: (e) => this.onResetSubmit(e) });

        if (this.props.action) {
            if (this.props.action === 'changePass') {
                this.showChangePasswordPopup();
            } else if (this.props.action === 'changeName') {
                this.showChangeNamePopup();
            }
        }
    }

    /** Old password input at change password form event handler */
    onOldPasswordInput() {
        window.app.clearBlockValidation('old-pwd-inp-block');
    }

    /** New password input at change password form event handler */
    onNewPasswordInput() {
        window.app.clearBlockValidation('new-pwd-inp-block');
    }

    /** New name input at change name form event handler */
    onNewNameInput() {
        window.app.clearBlockValidation('name-inp-block');
    }

    /** Creates change name popup */
    createChangeNamePopup() {
        this.changeNamePopup = Popup.create({
            id: 'chname_popup',
            title: 'Change name',
            content: this.changeNameContent,
            className: 'chname_popup',
        });
        show(this.changeNameContent, true);

        this.changeNamePopup.setControls({
            okBtn: { value: 'Submit', onclick: (ev) => this.onChangeNameSubmit(ev) },
            closeBtn: true,
        });

        this.newNameInp = ge('newname');
        if (!this.newNameInp) {
            throw new Error('Failed to initialize change name dialog');
        }
        setEvents(this.newNameInp, { input: () => this.onNewNameInput() });

        this.changeNameLoading = LoadingIndicator.create({ fixed: false });
        this.changeNameContent.append(this.changeNameLoading.elem);
    }

    /** Show change name popup */
    showChangeNamePopup(e) {
        if (e) {
            e.preventDefault();
        }

        if (!this.changeNamePopup) {
            this.createChangeNamePopup();
        }

        this.newNameInp.value = window.app.model.profile.name;

        this.changeNamePopup.show();
    }

    /** Change password form submit event handler */
    onChangePassSubmit(e) {
        let valid = true;

        e.preventDefault();

        if (!this.oldPassInp.value || this.oldPassInp.value.length < 1) {
            window.app.invalidateBlock('old-pwd-inp-block');
            valid = false;
        }

        if (!this.newPassInp.value
            || this.newPassInp.value.length < 1
            || this.newPassInp.value === this.oldPassInp.value) {
            window.app.invalidateBlock('new-pwd-inp-block');
            valid = false;
        }

        if (valid) {
            this.requestPasswordChange(this.oldPassInp.value, this.newPassInp.value);
        }
    }

    /** Request password change */
    async requestPasswordChange(currentPassword, newPassword) {
        this.changePassLoading.show();

        let result;
        try {
            result = await API.profile.changePassword(currentPassword, newPassword);
        } catch (e) {
            result = null;
        }

        this.changePassLoading.hide();

        if (!result) {
            return;
        }

        const success = (result.result === 'ok');
        if (success) {
            this.changePassPopup.close();
        }

        if (result.msg) {
            window.app.createMessage(result.msg, (success) ? 'msg_success' : 'msg_error');
        }

        this.changePassForm.reset();
    }

    /** Creates change password popup */
    createChangePasswordPopup() {
        this.changePassPopup = Popup.create({
            id: 'chpass_popup',
            title: 'Change password',
            content: this.changePassContent,
            className: 'chpass_popup',
        });
        show(this.changePassContent, true);

        this.changePassPopup.setControls({
            okBtn: { value: 'Submit', onclick: (e) => this.onChangePassSubmit(e) },
            closeBtn: true,
        });

        this.oldPassInp = ge('oldpwd');
        this.newPassInp = ge('newpwd');
        if (!this.oldPassInp || !this.newPassInp) {
            throw new Error('Failed to initialize change password dialog');
        }
        setEvents(this.oldPassInp, { input: () => this.onOldPasswordInput() });
        setEvents(this.newPassInp, { input: () => this.onNewPasswordInput() });

        this.changePassLoading = LoadingIndicator.create({ fixed: false });
        this.changePassContent.append(this.changePassLoading.elem);
    }

    /** Show change password popup */
    showChangePasswordPopup(e) {
        if (e) {
            e.preventDefault();
        }

        if (!this.changePassPopup) {
            this.createChangePasswordPopup();
        }

        this.changePassPopup.show();
    }

    /** Change name form submit event handler */
    onChangeNameSubmit(e) {
        let valid = true;

        e.preventDefault();

        if (!this.newNameInp.value
            || this.newNameInp.value.length < 1
            || this.newNameInp.value === window.app.model.profile.name) {
            window.app.invalidateBlock('name-inp-block');
            valid = false;
        }

        if (valid) {
            this.requestNameChange(this.newNameInp.value);
        }
    }

    /** Send request to API to change user name */
    async requestNameChange(name) {
        this.changeNameLoading.show();

        let result;
        try {
            result = await API.profile.changeName(name);
        } catch (e) {
            result = null;
        }

        this.changeNameLoading.hide();

        if (!result) {
            return;
        }

        const success = (result.result === 'ok');
        if (success) {
            this.changeNamePopup.close();
            window.app.model.profile.name = result.data.name;
            this.nameElem.textContent = window.app.model.profile.name;
            this.header.setUserName(window.app.model.profile.name);
        }

        if (result.msg) {
            window.app.createMessage(result.msg, (success) ? 'msg_success' : 'msg_error');
        }

        this.changeNameForm.reset();
    }

    /** Creates reset popup */
    createResetPopup() {
        this.resetPopup = Popup.create({
            id: 'reset_popup',
            title: 'Reset data',
            content: this.resetContent,
            className: 'reset-dialog',
        });
        show(this.resetContent, true);

        this.resetPopup.setControls({
            okBtn: { value: 'Submit', onclick: (e) => this.onResetSubmit(e) },
            closeBtn: true,
        });

        this.resetAllCheck = Checkbox.fromElement(
            ge('resetAllCheck'),
            { onChange: () => this.onToggleResetAll() },
        );

        this.accountsCheck = Checkbox.fromElement(
            ge('accountsCheck'),
            { onChange: () => this.onResetFormChange() },
        );

        this.personsCheck = Checkbox.fromElement(
            ge('personsCheck'),
            { onChange: () => this.onResetFormChange() },
        );

        this.transactionsCheck = Checkbox.fromElement(
            ge('transactionsCheck'),
            { onChange: () => this.onResetFormChange() },
        );

        this.keepAccountsBalanceCheck = Checkbox.fromElement(
            ge('keepAccountsBalanceCheck'),
            { onChange: () => this.onResetFormChange() },
        );

        this.importTemplatesCheck = Checkbox.fromElement(
            ge('importTemplatesCheck'),
            { onChange: () => this.onResetFormChange() },
        );

        this.importRulesCheck = Checkbox.fromElement(
            ge('importRulesCheck'),
            { onChange: () => this.onResetFormChange() },
        );

        this.resetLoading = LoadingIndicator.create({ fixed: false });
        this.resetContent.append(this.resetLoading.elem);
    }

    /** Show reset popup */
    showResetPopup(e) {
        if (e) {
            e.preventDefault();
        }

        if (!this.resetPopup) {
            this.createResetPopup();
        }

        this.resetPopup.show();
    }

    /** 'Reset all' checkbox change event handler */
    onToggleResetAll() {
        const resetAll = this.resetAllCheck.checked;

        this.accountsCheck.check(resetAll);
        this.personsCheck.check(resetAll);
        this.transactionsCheck.check(resetAll);
        if (resetAll) {
            this.keepAccountsBalanceCheck.enable(false);
        }

        this.importTemplatesCheck.check(resetAll);
        this.importRulesCheck.check(resetAll);
    }

    /** Reset data form change handler */
    onResetFormChange() {
        const resetAll = (
            this.accountsCheck.checked
            && this.personsCheck.checked
            && this.transactionsCheck.checked
            && this.importTemplatesCheck.checked
            && this.importRulesCheck.checked
        );

        this.resetAllCheck.check(resetAll);

        const enableKeepBalance = (
            (!this.accountsCheck.checked || !this.personsCheck.checked)
            && this.transactionsCheck.checked
        );
        this.keepAccountsBalanceCheck.enable(enableKeepBalance);
    }

    /** Reset data dialog submit event handler */
    onResetSubmit(e) {
        e.preventDefault();

        this.requestResetData();
    }

    /** Send reset data API request */
    async requestResetData() {
        this.resetLoading.show();

        const request = {};
        if (this.accountsCheck.checked) {
            request.accounts = true;
        }
        if (this.personsCheck.checked) {
            request.persons = true;
        }
        if (this.transactionsCheck.checked) {
            request.transactions = true;
        }
        if (!this.keepAccountsBalanceCheck.disabled && this.keepAccountsBalanceCheck.checked) {
            request.keepbalance = true;
        }
        if (this.importTemplatesCheck.checked) {
            request.importtpl = true;
        }
        if (this.importRulesCheck.checked) {
            request.importrules = true;
        }

        try {
            const result = await API.profile.reset(request);

            this.resetPopup.close();
            this.resetForm.reset();

            if (result.msg) {
                window.app.createMessage(result.msg, 'msg_success');
            }
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
        }

        this.resetLoading.hide();
    }

    /** Send delete profile API request */
    async requestDeleteProfile() {
        this.deleteLoading.show();

        try {
            await API.profile.del();
            window.location = `${window.app.baseURL}login/`;
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
            this.deleteLoading.hide();
        }
    }

    /** Show delete profile confirmation popup */
    confirmDelete() {
        if (!this.deleteLoading) {
            this.deleteLoading = LoadingIndicator.create({ fixed: false });
            document.documentElement.append(this.deleteLoading.elem);
        }

        ConfirmDialog.create({
            id: 'delete_warning',
            title: TITLE_PROFILE_DELETE,
            content: MSG_PROFILE_DELETE,
            onconfirm: () => this.requestDeleteProfile(),
        });
    }
}

window.app = new Application(window.appProps);
window.app.createView(ProfileView);
