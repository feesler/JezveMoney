import 'jezvejs/style';
import {
    ge,
    show,
    ajax,
} from 'jezvejs';
import { Popup } from 'jezvejs/Popup';
import { createMessage } from '../../js/app.js';
import { View } from '../../js/View.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import '../../css/app.css';
import './style.css';

const TITLE_RESET_ACC = 'Reset accounts';
const MSG_RESET_ACC = 'Are you sure want to reset all your accounts?<br>All accounts and transactions will be lost.';
const TITLE_RESET_ALL = 'Reset all data';
const MSG_RESET_ALL = 'Are you sure to reset all your data?<br>Everything will be lost.';
const TITLE_PROFILE_DELETE = 'Delete profile';
const MSG_PROFILE_DELETE = 'Are you sure to completely delete your profile?<br>This operation can not be undone.';

/**
 * User profile view
 */
class ProfileView extends View {
    constructor(...args) {
        super(...args);

        this.model = {};

        if (this.props.profile) {
            this.model.data = this.props.profile;
        }
    }

    /**
     * View initialization
     */
    onStart() {
        this.changeNamePopup = null;
        this.changePassPopup = null;

        this.nameElem = ge('namestatic');
        if (!this.nameElem) {
            throw new Error('Failed to initialize Profile view');
        }

        this.changeNameBtn = ge('changeNameBtn');
        if (!this.changeNameBtn) {
            throw new Error('Failed to initialize Profile view');
        }
        this.changeNameBtn.addEventListener('click', (e) => this.showChangeNamePopup(e));

        this.changePassBtn = ge('changePassBtn');
        if (!this.changePassBtn) {
            throw new Error('Failed to initialize Profile view');
        }
        this.changePassBtn.addEventListener('click', (e) => this.showChangePasswordPopup(e));

        this.resetAccBtn = ge('resetAccBtn');
        if (!this.resetAccBtn) {
            throw new Error('Failed to initialize Profile view');
        }
        this.resetAccBtn.addEventListener('click', () => this.confirmResetAccounts());

        this.resetAccForm = ge('resetacc_form');
        if (!this.resetAccForm) {
            throw new Error('Failed to initialize Profile view');
        }

        this.resetAllBtn = ge('resetAllBtn');
        if (!this.resetAllBtn) {
            throw new Error('Failed to initialize Profile view');
        }
        this.resetAllBtn.addEventListener('click', () => this.confirmResetAll());

        this.resetAllForm = ge('resetall_form');
        if (!this.resetAllForm) {
            throw new Error('Failed to initialize Profile view');
        }

        this.delProfileBtn = ge('delProfileBtn');
        if (!this.delProfileBtn) {
            throw new Error('Failed to initialize Profile view');
        }
        this.delProfileBtn.addEventListener('click', () => this.confirmDelete());

        this.deleteForm = ge('delete_form');
        if (!this.deleteForm) {
            throw new Error('Failed to initialize Profile view');
        }

        this.changeNameContent = ge('changename');
        if (!this.changeNameContent) {
            throw new Error('Failed to initialize Profile view');
        }
        this.changeNameForm = this.changeNameContent.querySelector('form');
        if (!this.changeNameForm) {
            throw new Error('Failed to initialize Profile view');
        }
        this.changeNameForm.addEventListener('submit', (e) => this.onChangeNameSubmit(e));

        this.changePassContent = ge('changepass');
        if (!this.changePassContent) {
            throw new Error('Failed to initialize Profile view');
        }
        this.changePassForm = this.changePassContent.querySelector('form');
        if (!this.changePassForm) {
            throw new Error('Failed to initialize Profile view');
        }
        this.changePassForm.addEventListener('submit', (e) => this.onChangePassSubmit(e));

        if (this.props.action) {
            if (this.props.action === 'changePass') {
                this.showChangePasswordPopup();
            } else if (this.props.action === 'changeName') {
                this.showChangeNamePopup();
            }
        }
    }

    /**
     * Old password input at change password form event handler
     */
    onOldPasswordInput() {
        this.clearBlockValidation('old-pwd-inp-block');
    }

    /**
     * New password input at change password form event handler
     */
    onNewPasswordInput() {
        this.clearBlockValidation('new-pwd-inp-block');
    }

    /**
     * New name input at change name form event handler
     */
    onNewNameInput() {
        this.clearBlockValidation('name-inp-block');
    }

    // Create and show change name popup
    showChangeNamePopup(e) {
        if (e) {
            e.preventDefault();
        }

        if (!this.changeNamePopup) {
            this.changeNamePopup = Popup.create({
                id: 'chname_popup',
                title: 'Change name',
                content: this.changeNameContent,
                additional: 'chname_popup',
            });

            this.changeNamePopup.setControls({
                okBtn: { onclick: (ev) => this.onChangeNameSubmit(ev) },
                closeBtn: true,
            });

            this.newNameInp = ge('newname');
            this.changeNameLoading = ge('changeNameLoading');
            if (!this.newNameInp || !this.changeNameLoading) {
                throw new Error('Failed to initialize change name dialog');
            }

            this.newNameInp.addEventListener('input', () => this.onNewNameInput());
        }

        this.newNameInp.value = this.model.data.name;

        this.changeNamePopup.show();
    }

    /**
     * Change password request callback
     * @param {string} response - text of response
     */
    onChangePasswordResult(response) {
        show(this.changePassLoading, false);

        const res = JSON.parse(response);
        if (!res) {
            return;
        }

        const success = (res.result === 'ok');
        if (success) {
            this.changePassPopup.close();
        }

        if (res.msg) {
            createMessage(res.msg, (success) ? 'msg_success' : 'msg_error');
        }

        this.changePassForm.reset();
    }

    /**
     * Change password form submit event handler
     */
    onChangePassSubmit(e) {
        const { baseURL } = window.app;
        let valid = true;

        e.preventDefault();

        if (!this.oldPassInp.value || this.oldPassInp.value.length < 1) {
            this.invalidateBlock('old-pwd-inp-block');
            valid = false;
        }

        if (!this.newPassInp.value
            || this.newPassInp.value.length < 1
            || this.newPassInp.value === this.oldPassInp.value) {
            this.invalidateBlock('new-pwd-inp-block');
            valid = false;
        }

        if (valid) {
            show(this.changePassLoading, true);

            ajax.post({
                url: `${baseURL}api/profile/changepass`,
                data: JSON.stringify({
                    current: this.oldPassInp.value,
                    new: this.newPassInp.value,
                }),
                headers: { 'Content-Type': 'application/json' },
                callback: (response) => this.onChangePasswordResult(response),
            });
        }
    }

    /**
     * Show change password popup
     */
    showChangePasswordPopup(e) {
        if (e) {
            e.preventDefault();
        }

        if (!this.changePassPopup) {
            this.changePassPopup = Popup.create({
                id: 'chpass_popup',
                title: 'Change password',
                content: this.changePassContent,
                additional: 'chpass_popup',
            });

            this.changePassPopup.setControls({
                okBtn: { onclick: (ev) => this.onChangePassSubmit(ev) },
                closeBtn: true,
            });

            this.oldPassInp = ge('oldpwd');
            this.newPassInp = ge('newpwd');
            this.changePassLoading = ge('changePassLoading');
            if (!this.oldPassInp
                || !this.newPassInp
                || !this.changePassLoading) {
                throw new Error('Failed to initialize change password dialog');
            }

            this.oldPassInp.addEventListener('input', () => this.onOldPasswordInput());
            this.newPassInp.addEventListener('input', () => this.onNewPasswordInput());
        }

        this.changePassPopup.show();
    }

    /**
     * Change name request callback
     * @param {String} response - response text
     */
    onChangeNameResult(response) {
        show(this.changeNameLoading, false);

        const res = JSON.parse(response);
        if (!res) {
            return;
        }

        const success = (res.result === 'ok');
        if (success) {
            this.changeNamePopup.close();
            this.model.data.name = res.data.name;
            this.nameElem.textContent = this.model.data.name;
            this.header.setUserName(this.model.data.name);
        }

        if (res.msg) {
            createMessage(res.msg, (success) ? 'msg_success' : 'msg_error');
        }

        this.changeNameForm.reset();
    }

    /**
     * Change name form submit event handler
     */
    onChangeNameSubmit(e) {
        let valid = true;

        e.preventDefault();

        if (!this.newNameInp.value
            || this.newNameInp.value.length < 1
            || this.newNameInp.value === this.model.data.name) {
            this.invalidateBlock('name-inp-block');
            valid = false;
        }

        if (valid) {
            show(this.changeNameLoading, true);

            const { baseURL } = window.app;
            ajax.post({
                url: `${baseURL}api/profile/changename`,
                data: JSON.stringify({
                    name: this.newNameInp.value,
                }),
                headers: { 'Content-Type': 'application/json' },
                callback: (response) => this.onChangeNameResult(response),
            });
        }
    }

    /**
     * Show reset accounts confirmation popup
     */
    confirmResetAccounts() {
        ConfirmDialog.create({
            id: 'reset_warning',
            title: TITLE_RESET_ACC,
            content: MSG_RESET_ACC,
            onconfirm: () => this.resetAccForm.submit(),
        });
    }

    /**
     * Show reset all data confirmation popup
     */
    confirmResetAll() {
        ConfirmDialog.create({
            id: 'reset_all_warning',
            title: TITLE_RESET_ALL,
            content: MSG_RESET_ALL,
            onconfirm: () => this.resetAllForm.submit(),
        });
    }

    /**
     * Show delete profile confirmation popup
     */
    confirmDelete() {
        ConfirmDialog.create({
            id: 'delete_warning',
            title: TITLE_PROFILE_DELETE,
            content: MSG_PROFILE_DELETE,
            onconfirm: () => this.deleteForm.submit(),
        });
    }
}

window.view = new ProfileView(window.app);
