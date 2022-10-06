import 'jezvejs/style';
import { ge } from 'jezvejs';
import { Checkbox } from 'jezvejs/Checkbox';
import { Application } from '../../js/Application.js';
import { View } from '../../js/View.js';
import '../../css/app.scss';
import './style.scss';

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
        this.rememberCheck = Checkbox.fromElement(checkElem);
        this.form.addEventListener('submit', (e) => this.onSubmit(e));
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
        if (state.validation.login) {
            window.app.clearBlockValidation('login-inp-block');
        } else {
            window.app.invalidateBlock('login-inp-block');
        }

        // Password input
        if (state.validation.password) {
            window.app.clearBlockValidation('pwd-inp-block');
        } else {
            window.app.invalidateBlock('pwd-inp-block');
        }
    }
}

window.app = new Application(window.appProps);
window.app.createView(LoginView);
