import 'jezvejs/style';
import { setEvents } from 'jezvejs';
import { Checkbox } from 'jezvejs/Checkbox';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { View } from '../../js/View.js';
import { parseCookies, setCookie } from '../../js/utils.js';
import { createStore } from '../../js/store.js';
import { actions, reducer } from './reducer.js';
import '../../Components/Field/style.scss';
import './style.scss';

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
            'loginInp',
            'passwordInp',
            'rememberCheck',
        ]);

        setEvents(this.form, { submit: (e) => this.onSubmit(e) });
        setEvents(this.loginInp, { input: () => this.onLoginInput() });
        setEvents(this.passwordInp, { input: () => this.onPasswordInput() });

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
    onLoginInput() {
        const { value } = this.loginInp;
        this.store.dispatch(actions.changeLogin(value));
    }

    /**
     * Password field input event handler
     */
    onPasswordInput() {
        const { value } = this.passwordInp;
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

        // Login input
        this.loginInp.value = state.form.login;
        window.app.setValidation('login-inp-block', state.validation.login);

        // Password input
        this.passwordInp.value = state.form.password;
        window.app.setValidation('pwd-inp-block', state.validation.password);

        // 'Remember me' checkbox
        this.rememberCheck.check(state.form.remember);
    }
}

window.app = new Application(window.appProps);
window.app.createView(LoginView);
