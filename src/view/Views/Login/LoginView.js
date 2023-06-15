import 'jezvejs/style';
import { createElement } from 'jezvejs';
import { Checkbox } from 'jezvejs/Checkbox';
import { createStore } from 'jezvejs/Store';
import { App } from '../../Application/App.js';
import '../../Application/Application.scss';
import { View } from '../../utils/View.js';
import { __, parseCookies, setCookie } from '../../utils/utils.js';
import { InputField } from '../../Components/InputField/InputField.js';
import { actions, reducer } from './reducer.js';
import './LoginView.scss';
import { FormControls } from '../../Components/FormControls/FormControls.js';
import { Field } from '../../Components/Field/Field.js';

/**
 * User log in view
 */
class LoginView extends View {
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
            'formContainer',
        ]);

        // Form title
        this.titleElem = createElement('h1', { props: { textContent: __('LOG_IN') } });

        // Login field
        this.loginField = InputField.create({
            id: 'loginField',
            inputId: 'loginInp',
            className: 'form-row',
            name: 'login',
            title: __('LOG_IN_USERNAME'),
            validate: true,
            feedbackMessage: __('LOG_IN_INVALID_USERNAME'),
            onInput: (e) => this.onLoginInput(e),
        });

        // Password field
        this.passwordField = InputField.create({
            id: 'passwordField',
            inputId: 'passwordInp',
            className: 'form-row',
            name: 'password',
            type: 'password',
            title: __('LOG_IN_PASSWORD'),
            validate: true,
            feedbackMessage: __('LOG_IN_INVALID_PASSWORD'),
            onInput: (e) => this.onPasswordInput(e),
        });

        this.rememberCheck = Checkbox.create({
            id: 'rememberCheck',
            label: __('LOG_IN_REMEMBER'),
            onChange: () => this.onToggleRememberCheck(),
        });

        this.rememberField = Field.create({
            id: 'rememberField',
            className: 'form-row',
            content: this.rememberCheck.elem,
        });

        // Form controls
        this.controls = FormControls.create({
            submitTitle: __('LOG_IN_BUTTON'),
            cancelTitle: __('REGISTRATION'),
            cancelBtnClass: 'alter-link',
            cancelURL: `${App.baseURL}register/`,
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
