import {
    ge,
    show,
    setEvents,
    isFunction,
    Component,
} from 'jezvejs';
import { Popup } from 'jezvejs/Popup';
import { API } from '../../../js/api/index.js';
import { LoadingIndicator } from '../../LoadingIndicator/LoadingIndicator.js';
import './style.scss';

/** CSS classes */
const DIALOG_CLASS = 'password-dialog';
/** Strings */
const DIALOG_TITLE = 'Change password';

export class ChangePasswordDialog extends Component {
    static create(props) {
        return new ChangePasswordDialog(props);
    }

    constructor(...args) {
        super(...args);

        this.init();
    }

    init() {
        this.elem = ge('changepass');
        this.form = this.elem?.querySelector('form');
        this.oldPassInp = ge('oldpwd');
        this.newPassInp = ge('newpwd');
        if (
            !this.elem
            || !this.form
            || !this.oldPassInp
            || !this.newPassInp
        ) {
            throw new Error('Failed to initialize Change password form');
        }

        setEvents(this.form, { submit: (e) => this.onSubmit(e) });
        setEvents(this.oldPassInp, { input: (e) => this.onOldPasswordInput(e) });
        setEvents(this.newPassInp, { input: (e) => this.onNewPasswordInput(e) });

        this.popup = Popup.create({
            id: 'chpass_popup',
            title: DIALOG_TITLE,
            content: this.elem,
            className: DIALOG_CLASS,
            btn: {
                okBtn: { value: 'Submit', onclick: (e) => this.onSubmit(e) },
                closeBtn: true,
            },
            onclose: () => this.onClose(),
        });
        show(this.elem, true);

        this.loadingIndicator = LoadingIndicator.create({ fixed: false });
        this.elem.append(this.loadingIndicator.elem);

        this.reset();
    }

    onClose() {
        this.reset();

        if (isFunction(this.props.onClose)) {
            this.props.onClose();
        }
    }

    /** Show/hide dialog */
    show(val) {
        this.render(this.state);
        this.popup.show(val);
    }

    /** Hide dialog */
    hide() {
        this.popup.hide();
    }

    /** Reset dialog state */
    reset() {
        this.form.reset();
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

    startLoading() {
        this.setState({ ...this.state, loading: true });
    }

    stopLoading() {
        this.setState({ ...this.state, loading: false });
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

    /** Change name form submit event handler */
    onSubmit(e) {
        e.preventDefault();

        const validation = {
            valid: true,
            oldPassword: true,
            newPassword: true,
        };

        if (!this.state.oldPassword || this.state.oldPassword.length === 0) {
            validation.oldPassword = false;
            validation.valid = false;
        }

        if (
            !this.state.newPassword
            || this.state.newPassword.length === 0
            || this.state.newPassword === this.state.oldPassword
        ) {
            validation.newPassword = false;
            validation.valid = false;
        }

        if (validation.valid) {
            this.requestPasswordChange();
        } else {
            this.setState({ ...this.state, validation });
        }
    }

    /** Send request to API to change user password */
    async requestPasswordChange() {
        this.startLoading();

        try {
            const { oldPassword, newPassword } = this.state;
            const result = await API.profile.changePassword(oldPassword, newPassword);

            this.popup.close();

            if (result.msg) {
                window.app.createMessage(result.msg, 'msg_success');
            }
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
        }

        this.stopLoading();
    }

    /** Render component state */
    render(state) {
        if (state.loading) {
            this.loadingIndicator.show();
        }

        this.oldPassInp.value = state.oldPassword;
        if (state.validation.oldPassword) {
            window.app.clearBlockValidation('old-pwd-inp-block');
        } else {
            window.app.invalidateBlock('old-pwd-inp-block');
        }

        this.newPassInp.value = state.newPassword;
        if (state.validation.newPassword) {
            window.app.clearBlockValidation('new-pwd-inp-block');
        } else {
            window.app.invalidateBlock('new-pwd-inp-block');
        }

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}
