import 'jezvejs/style';
import { ge } from 'jezvejs';
import { Checkbox } from 'jezvejs/Checkbox';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { View } from '../../js/View.js';
import './style.scss';
import { parseCookies, setCookie } from '../../js/utils.js';

/**
 * User log in view
 */
class LoginView extends View {
    constructor(...args) {
        super(...args);

        this.state = {
            form: {
                login: '',
                password: '',
                remember: true,
            },
            validation: {
                login: true,
                password: true,
            },
        };
    }

    /**
     * View initialization
     */
    onStart() {
        this.loginInp = ge('login');
        this.passwordInp = ge('password');
        const checkElem = ge('rememberCheck');
        this.form = ge('loginfrm');
        if (
            !this.loginInp
            || !this.passwordInp
            || !checkElem
            || !this.form
        ) {
            throw new Error('Failed to initialize Login view');
        }

        this.loginInp.addEventListener('input', () => this.onLoginInput());
        this.passwordInp.addEventListener('input', () => this.onPasswordInput());
        this.rememberCheck = Checkbox.fromElement(checkElem, {
            onChange: () => this.onToggleRememberCheck(),
        });
        this.form.addEventListener('submit', (e) => this.onSubmit(e));

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

        this.state.form.remember = !!value;
        this.render(this.state);
    }

    /**
     * Login field input event handler
     */
    onLoginInput() {
        this.state.form.login = this.loginInp.value;
        this.state.validation.login = true;
        this.render(this.state);
    }

    /**
     * Password field input event handler
     */
    onPasswordInput() {
        this.state.form.password = this.passwordInp.value;
        this.state.validation.password = true;
        this.render(this.state);
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
        const { login, password } = this.state.form;
        let valid = true;

        if (login.length === 0) {
            this.state.validation.login = false;
            valid = false;
        }

        if (password.length === 0) {
            this.state.validation.password = false;
            valid = false;
        }

        if (!valid) {
            e.preventDefault();
            this.render(this.state);
        }
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        // Login input
        window.app.setValidation('login-inp-block', state.validation.login);

        // Password input
        window.app.setValidation('pwd-inp-block', state.validation.password);

        // 'Remember me' checkbox
        this.rememberCheck.check(state.form.remember);
    }
}

window.app = new Application(window.appProps);
window.app.createView(LoginView);
