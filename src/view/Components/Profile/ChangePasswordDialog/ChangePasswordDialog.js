import { ge, setEvents } from 'jezvejs';
import { __ } from '../../../js/utils.js';
import { API } from '../../../js/api/index.js';
import { ProfileDialog } from '../ProfileDialog/ProfileDialog.js';

/** CSS classes */
const DIALOG_CLASS = 'password-dialog';
const OLD_PASS_BLOCK = 'old-pwd-inp-block';
const NEW_PASS_BLOCK = 'new-pwd-inp-block';

export class ChangePasswordDialog extends ProfileDialog {
    constructor(...args) {
        super(...args);

        this.init();
    }

    init() {
        this.elem = ge('changepass');
        this.oldPassInp = ge('oldpwd');
        this.newPassInp = ge('newpwd');
        if (
            !this.elem
            || !this.oldPassInp
            || !this.newPassInp
        ) {
            throw new Error('Failed to initialize Change password form');
        }

        setEvents(this.oldPassInp, { input: (e) => this.onOldPasswordInput(e) });
        setEvents(this.newPassInp, { input: (e) => this.onNewPasswordInput(e) });

        this.initDialog({
            id: 'chpass_popup',
            title: __('PROFILE_CHANGE_PASS'),
            className: DIALOG_CLASS,
        });

        this.reset();
    }

    /** Reset dialog state */
    reset() {
        super.reset();

        this.setState({
            oldPassword: '',
            newPassword: '',
            validation: {
                oldPassword: true,
                newPassword: true,
            },
            loading: false,
        });
    }

    /** Old password 'input' event handler */
    onOldPasswordInput(e) {
        this.setState({
            ...this.state,
            oldPassword: e.target.value,
            validation: {
                ...this.state.validation,
                oldPassword: true,
            },
        });
    }

    /** New password 'input' event handler */
    onNewPasswordInput(e) {
        this.setState({
            ...this.state,
            newPassword: e.target.value,
            validation: {
                ...this.state.validation,
                newPassword: true,
            },
        });
    }

    validateForm(state) {
        const res = {
            valid: true,
            oldPassword: true,
            newPassword: true,
        };

        if (!state.oldPassword || state.oldPassword.length === 0) {
            res.oldPassword = false;
            res.valid = false;
        }

        if (
            !state.newPassword
            || state.newPassword.length === 0
            || state.newPassword === state.oldPassword
        ) {
            res.newPassword = false;
            res.valid = false;
        }

        return res;
    }

    /** Send request to API to change user password */
    async sendFormRequest() {
        const { oldPassword, newPassword } = this.state;
        return API.profile.changePassword(oldPassword, newPassword);
    }

    /** Render component state */
    renderDialog(state) {
        this.oldPassInp.value = state.oldPassword;
        window.app.setValidation(OLD_PASS_BLOCK, state.validation.oldPassword);

        this.newPassInp.value = state.newPassword;
        window.app.setValidation(NEW_PASS_BLOCK, state.validation.newPassword);
    }
}
