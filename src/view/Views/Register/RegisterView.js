import 'jezvejs/style';
import { ge } from 'jezvejs';
import { Application } from '../../js/Application.js';
import { View } from '../../js/View.js';
import '../../css/app.css';
import './style.css';

/**
 * User registration view
 */
class RegisterView extends View {
    /**
     * View initialization
     */
    onStart() {
        this.loginInp = ge('login');
        this.passwordInp = ge('password');
        this.nameInp = ge('name');
        this.form = ge('regfrm');
        if (!this.loginInp || !this.passwordInp || !this.nameInp || !this.form) {
            throw new Error('Failed to initialize Login view');
        }

        this.loginInp.addEventListener('input', () => this.onLoginInput());
        this.passwordInp.addEventListener('input', () => this.onPasswordInput());
        this.nameInp.addEventListener('input', () => this.onNameInput());
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
     * Password field input event handler
     */
    onNameInput() {
        this.clearBlockValidation('name-inp-block');
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

        if (!this.nameInp.value || this.nameInp.value.length < 1) {
            this.invalidateBlock('name-inp-block');
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

window.app = new Application(window.appProps);
window.app.createView(RegisterView);
