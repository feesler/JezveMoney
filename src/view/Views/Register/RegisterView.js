import 'jezvejs/style';
import { setEvents } from 'jezvejs';
import { createStore } from 'jezvejs/Store';
import { __ } from '../../utils/utils.js';
import { Application } from '../../Application/Application.js';
import { View } from '../../utils/View.js';
import { LocaleSelectField } from '../../Components/LocaleSelectField/LocaleSelectField.js';
import { ThemeSwitchField } from '../../Components/ThemeSwitchField/ThemeSwitchField.js';
import { InputField } from '../../Components/InputField/InputField.js';
import { actions, reducer } from './reducer.js';
import '../../Application/Application.scss';
import './RegisterView.scss';

/**
 * User registration view
 */
class RegisterView extends View {
    constructor(...args) {
        super(...args);

        const initialState = {
            form: {
                login: '',
                name: '',
                password: '',
            },
            validation: {
                login: true,
                name: true,
                password: true,
            },
        };

        this.store = createStore(reducer, { initialState });
    }

    /**
     * View initialization
     */
    onStart() {
        this.loadElementsByIds([
            'form',
        ]);

        this.localeField = LocaleSelectField.create();
        this.themeField = ThemeSwitchField.create();
        this.header.userNavContent.append(this.localeField.elem, this.themeField.elem);

        setEvents(this.form, { submit: (e) => this.onSubmit(e) });

        // Login field
        this.loginField = InputField.create({
            id: 'loginField',
            inputId: 'loginInp',
            className: 'form-row',
            name: 'login',
            title: __('REG_ACCOUNT_NAME'),
            validate: true,
            feedbackMessage: __('REG_INVALID_ACCOUNT_NAME'),
            onInput: (e) => this.onLoginInput(e),
        });

        // Name field
        this.nameField = InputField.create({
            id: 'nameField',
            inputId: 'nameInp',
            className: 'form-row',
            name: 'name',
            title: __('REG_USER_NAME'),
            validate: true,
            feedbackMessage: __('REG_INVALID_USER_NAME'),
            onInput: (e) => this.onNameInput(e),
        });

        // Password field
        this.passwordField = InputField.create({
            id: 'passwordField',
            inputId: 'passwordInp',
            className: 'form-row',
            name: 'password',
            type: 'password',
            title: __('REG_PASSWORD'),
            validate: true,
            feedbackMessage: __('REG_INVALID_PASSWORD'),
            onInput: (e) => this.onPasswordInput(e),
        });

        this.form.prepend(
            this.loginField.elem,
            this.nameField.elem,
            this.passwordField.elem,
        );

        this.subscribeToStore(this.store);
    }

    /**
     * Login field input event handler
     */
    onLoginInput(e) {
        const { value } = e.target;
        this.store.dispatch(actions.changeLogin(value));
    }

    /**
     * Password field input event handler
     */
    onPasswordInput(e) {
        const { value } = e.target;
        this.store.dispatch(actions.changePassword(value));
    }

    /**
     * Password field input event handler
     */
    onNameInput(e) {
        const { value } = e.target;
        this.store.dispatch(actions.changeName(value));
    }

    /**
     * Log in form submit event handler
     */
    onSubmit(e) {
        const state = this.store.getState();
        const { login, name, password } = state.form;

        if (login.length === 0) {
            this.store.dispatch(actions.invalidateLoginField());
        }

        if (name.length === 0) {
            this.store.dispatch(actions.invalidateNameField());
        }

        if (password.length === 0) {
            this.store.dispatch(actions.invalidatePasswordField());
        }

        const { validation } = this.store.getState();
        if (!validation.valid) {
            e.preventDefault();
        }
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        // Login field
        this.loginField.setState((loginState) => ({
            ...loginState,
            value: state.form.login,
            valid: state.validation.login,
        }));

        // Name field
        this.nameField.setState((nameState) => ({
            ...nameState,
            value: state.form.name,
            valid: state.validation.name,
        }));

        // Password field
        this.passwordField.setState((passState) => ({
            ...passState,
            value: state.form.password,
            valid: state.validation.password,
        }));
    }
}

window.app = new Application(window.appProps);
window.app.createView(RegisterView);
