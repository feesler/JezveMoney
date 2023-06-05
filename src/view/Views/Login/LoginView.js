import 'jezvejs/style';
import { insertBefore, setEvents } from 'jezvejs';
import { Checkbox } from 'jezvejs/Checkbox';
import { createStore } from 'jezvejs/Store';
import { Application } from '../../Application/Application.js';
import '../../Application/Application.scss';
import { View } from '../../utils/View.js';
import { __, parseCookies, setCookie } from '../../utils/utils.js';
import { InputField } from '../../Components/InputField/InputField.js';
import { actions, reducer } from './reducer.js';
import './LoginView.scss';

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
            'form',
            'rememberField',
            'rememberCheck',
        ]);

        setEvents(this.form, { submit: (e) => this.onSubmit(e) });

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
        insertBefore(this.loginField.elem, this.rememberField);

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
        insertBefore(this.passwordField.elem, this.rememberField);

        this.rememberCheck = Checkbox.fromElement(this.rememberCheck, {
            onChange: () => this.onToggleRememberCheck(),
        });

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

window.app = new Application(window.appProps);
window.app.createView(LoginView);
