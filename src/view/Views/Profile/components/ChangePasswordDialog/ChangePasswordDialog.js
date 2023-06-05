import { ge } from 'jezvejs';
import { __ } from '../../../../utils/utils.js';
import { API } from '../../../../API/index.js';
import { InputField } from '../../../../Components/InputField/InputField.js';
import { ProfileDialog } from '../ProfileDialog/ProfileDialog.js';

/** CSS classes */
const DIALOG_CLASS = 'password-dialog';

export class ChangePasswordDialog extends ProfileDialog {
    constructor(...args) {
        super(...args);

        this.init();
    }

    init() {
        this.elem = ge('changepass');
        if (!this.elem) {
            throw new Error('Failed to initialize Change password form');
        }

        this.initDialog({
            id: 'chpass_popup',
            title: __('PROFILE_CHANGE_PASS'),
            className: DIALOG_CLASS,
        });

        // Old password field
        this.oldPassField = InputField.create({
            id: 'oldPassField',
            inputId: 'oldPassInp',
            className: 'form-row',
            name: 'current',
            type: 'password',
            title: __('PROFILE_PASSWORD_CURRENT'),
            validate: true,
            feedbackMessage: __('PROFILE_INVALID_PASS_CURRENT'),
            onInput: (e) => this.onOldPasswordInput(e),
        });

        // New password field
        this.newPassField = InputField.create({
            id: 'newPassField',
            inputId: 'newPassInp',
            className: 'form-row',
            name: 'new',
            type: 'password',
            title: __('PROFILE_PASSWORD_NEW'),
            validate: true,
            feedbackMessage: __('PROFILE_INVALID_PASS_NEW'),
            onInput: (e) => this.onNewPasswordInput(e),
        });

        this.form.prepend(this.oldPassField.elem, this.newPassField.elem);

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
        this.oldPassField.setState((passState) => ({
            ...passState,
            value: state.oldPassword,
            valid: state.validation.oldPassword,
        }));

        this.newPassField.setState((passState) => ({
            ...passState,
            value: state.newPassword,
            valid: state.validation.newPassword,
        }));
    }
}
