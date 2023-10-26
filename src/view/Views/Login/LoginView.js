import 'jezvejs/style';
import { createElement } from '@jezvejs/dom';
import { Checkbox } from 'jezvejs/Checkbox';
import { createStore } from 'jezvejs/Store';

import { App } from '../../Application/App.js';
import '../../Application/Application.scss';
import { AppView } from '../../Components/Layout/AppView/AppView.js';
import {
    __,
    getApplicationURL,
    parseCookies,
    setCookie,
} from '../../utils/utils.js';

import { Field } from '../../Components/Common/Field/Field.js';
import { Logo } from '../../Components/Common/Logo/Logo.js';
import { InputField } from '../../Components/Form/Fields/InputField/InputField.js';
import { PasswordField } from '../../Components/Form/Fields/PasswordField/PasswordField.js';
import { FormControls } from '../../Components/Form/FormControls/FormControls.js';

import { actions, reducer } from './reducer.js';
import './LoginView.scss';

/**
 * User log in view
 */
class LoginView extends AppView {
    constructor(...args) {
        super(...args);

        const initialState = {
            form: {
                login: '',
                password: '',
                remember: true,
            },
            validation: {
                login: true,
                password: true,
                valid: true,
            },
        };

        this.store = createStore(reducer, { initialState });
    }

    /**
     * View initialization
     */
    onStart() {
        this.loadElementsByIds([
            'logoContainer',
            'formContainer',
        ]);

        this.logo = Logo.create({
            className: 'login-logo',
            icon: 'logo_u',
            type: 'static',
        });
        this.logoContainer.append(this.logo.elem);

        // Form title
        this.titleElem = createElement('h1', { props: { textContent: __('login.title') } });

        // Login field
        this.loginField = InputField.create({
            id: 'loginField',
            inputId: 'loginInp',
            className: 'form-row',
            name: 'login',
            title: __('login.userName'),
            validate: true,
            feedbackMessage: __('login.invalidUserName'),
            onInput: (e) => this.onLoginInput(e),
        });

        // Password field
        this.passwordField = PasswordField.create({
            id: 'passwordField',
            inputId: 'passwordInp',
            className: 'form-row',
            name: 'password',
            title: __('login.password'),
            validate: true,
            feedbackMessage: __('login.invalidPassword'),
            onInput: (e) => this.onPasswordInput(e),
        });

        this.rememberCheck = Checkbox.create({
            id: 'rememberCheck',
            label: __('login.remember'),
            onChange: () => this.onToggleRememberCheck(),
        });

        this.rememberField = Field.create({
            id: 'rememberField',
            className: 'form-row',
            content: this.rememberCheck.elem,
        });

        // Form controls
        this.controls = FormControls.create({
            submitBtn: {
                title: __('login.submitButton'),
            },
            cancelBtn: {
                title: __('registration.title'),
                url: getApplicationURL('register/'),
                className: 'alter-link',
            },
        });

        // Log in form
        this.form = createElement('form', {
            props: {
                className: 'login-form',
                action: `${App.baseURL}login/`,
                method: 'post',
            },
            events: { submit: (e) => this.onSubmit(e) },
            children: [
                this.titleElem,
                this.loginField.elem,
                this.passwordField.elem,
                this.rememberField.elem,
                this.controls.elem,
            ],
        });

        this.formContainer.append(this.form);

        this.subscribeToStore(this.store);
        this.onPostInit();
    }

    onPostInit() {
        this.setupCookies();
    }

    getRememberCookie() {
        const cookies = parseCookies();
        return cookies.find((item) => item.name === 'remember');
    }

    setupCookies() {
        const cookie = this.getRememberCookie();
        const remember = (cookie)
            ? (parseInt(cookie.value, 10) === 1)
            : true;
        this.setRememberUser(remember);
    }

    setRememberUser(value) {
        setCookie('remember', (value) ? 1 : 0);

        this.store.dispatch(actions.setRememberUser(value));
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
     * 'Remember me' checkbox 'change' event handler
     */
    onToggleRememberCheck() {
        const remember = this.rememberCheck.checked;
        this.setRememberUser(remember);
    }

    /**
     * Log in form submit event handler
     */
    onSubmit(e) {
        const state = this.store.getState();
        const { login, password } = state.form;

        if (login.length === 0) {
            this.store.dispatch(actions.invalidateLoginField());
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

        // Password field
        this.passwordField.setState((passState) => ({
            ...passState,
            value: state.form.password,
            valid: state.validation.password,
        }));

        // 'Remember me' checkbox
        this.rememberCheck.check(state.form.remember);
    }
}

App.createView(LoginView);
