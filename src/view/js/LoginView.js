import { ge } from 'jezvejs';
import { View } from './View.js';
import '../css/lib/common.css';
import '../css/app.css';
import '../css/user.css';

/**
 * User log in view
 */
class LoginView extends View {
    constructor(...args) {
        super(...args);

        this.model = {};
    }

    /**
     * View initialization
     */
    onStart() {
        this.loginInp = ge('login');
        this.passwordInp = ge('password');
        this.form = ge('loginfrm');
        if (!this.loginInp || !this.passwordInp || !this.form) {
            throw new Error('Failed to initialize Login view');
        }

        this.loginInp.addEventListener('input', this.onLoginInput.bind(this));
        this.passwordInp.addEventListener('input', this.onPasswordInput.bind(this));
        this.form.addEventListener('submit', this.onSubmit.bind(this));
    }

    /**
     * Login field input event handler
     */
    onLoginInput() {
        this.clearBlockValidation('login-inp-block');
    }

    /**
     * Password field input event handler
     */
    onPasswordInput() {
        this.clearBlockValidation('pwd-inp-block');
    }

    /**
     * Log in form submit event handler
     */
    onSubmit(e) {
        let valid = true;

        if (!this.loginInp.value || this.loginInp.value.length < 1) {
            this.invalidateBlock('login-inp-block');
            valid = false;
        }

        if (!this.passwordInp.value || this.passwordInp.value.length < 1) {
            this.invalidateBlock('pwd-inp-block');
            valid = false;
        }

        if (!valid) {
            e.preventDefault();
        }
    }
}

window.view = new LoginView(window.app);
