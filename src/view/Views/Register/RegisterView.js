import 'jezvejs/style';
import { createElement } from 'jezvejs';
import { createStore } from 'jezvejs/Store';

import { __ } from '../../utils/utils.js';
import { App } from '../../Application/App.js';
import { View } from '../../utils/View.js';

import { LocaleSelectField } from '../../Components/LocaleSelectField/LocaleSelectField.js';
import { ThemeSwitchField } from '../../Components/ThemeSwitchField/ThemeSwitchField.js';
import { InputField } from '../../Components/InputField/InputField.js';
import { FormControls } from '../../Components/FormControls/FormControls.js';

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
            'formContainer',
        ]);

        this.localeField = LocaleSelectField.create();
        this.themeField = ThemeSwitchField.create();
        this.header.userNavContent.append(this.localeField.elem, this.themeField.elem);

        // Form title
        this.titleElem = createElement('h1', { props: { textContent: __('registration.title') } });

        // Login field
        this.loginField = InputField.create({
            id: 'loginField',
            inputId: 'loginInp',
            className: 'form-row',
            name: 'login',
            title: __('registration.accountName'),
            validate: true,
            feedbackMessage: __('registration.invalidAccountName'),
            onInput: (e) => this.onLoginInput(e),
        });

        // Name field
        this.nameField = InputField.create({
            id: 'nameField',
            inputId: 'nameInp',
            className: 'form-row',
            name: 'name',
            title: __('registration.userName'),
            validate: true,
            feedbackMessage: __('registration.invalidUserName'),
            onInput: (e) => this.onNameInput(e),
        });

        // Password field
        this.passwordField = InputField.create({
            id: 'passwordField',
            inputId: 'passwordInp',
            className: 'form-row',
            name: 'password',
            type: 'password',
            title: __('registration.password'),
            validate: true,
            feedbackMessage: __('registration.invalidPassword'),
            onInput: (e) => this.onPasswordInput(e),
        });

        // Form controls
        this.controls = FormControls.create({
            submitTitle: __('actions.submit'),
            cancelTitle: __('actions.cancel'),
            cancelBtnClass: 'alter-link',
            cancelURL: `${App.baseURL}login/`,
        });

        // Registration form
        this.form = createElement('form', {
            props: {
                className: 'register-form',
                action: `${App.baseURL}register/`,
                method: 'post',
            },
            events: { submit: (e) => this.onSubmit(e) },
            children: [
                this.titleElem,
                this.loginField.elem,
                this.nameField.elem,
                this.passwordField.elem,
                this.controls.elem,
            ],
        });

        this.formContainer.append(this.form);

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

App.createView(RegisterView);
