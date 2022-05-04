import 'jezvejs/style';
import { ge } from 'jezvejs';
import { View } from '../../js/View.js';
import '../../css/app.css';
import './style.css';

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

        this.loginInp.addEventListener('input', () => this.onLoginInput());
        this.passwordInp.addEventListener('input', () => this.onPasswordInput());
        this.form.addEventListener('submit', (e) => this.onSubmit(e));
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
