import { __ } from '../../../../utils/utils.js';
import { API } from '../../../../API/index.js';

import { PasswordField } from '../../../../Components/Form/Fields/PasswordField/PasswordField.js';
import { ProfileDialog } from '../ProfileDialog/ProfileDialog.js';

/** CSS classes */
const DIALOG_CLASS = 'password-dialog';

export class ChangePasswordDialog extends ProfileDialog {
    init() {
        this.initDialog({
            id: 'chpass_popup',
            containerId: 'changepass',
            action: 'profile/changepass/',
            title: __('profile.changePassword'),
            className: DIALOG_CLASS,
        });

        // Old password field
        this.oldPassField = PasswordField.create({
            id: 'oldPassField',
            inputId: 'oldPassInp',
            className: 'form-row',
            name: 'current',
            title: __('profile.currentPassword'),
            validate: true,
            feedbackMessage: __('profile.invalidCurrentPassword'),
            onInput: (e) => this.onOldPasswordInput(e),
        });

        // New password field
        this.newPassField = PasswordField.create({
            id: 'newPassField',
            inputId: 'newPassInp',
            className: 'form-row',
            name: 'new',
            title: __('profile.newPassword'),
            validate: true,
            feedbackMessage: __('profile.invalidNewPassword'),
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
