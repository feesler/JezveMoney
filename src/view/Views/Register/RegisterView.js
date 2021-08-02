import 'jezvejs/style';
import { ge } from 'jezvejs';
import { View } from '../../js/View.js';
import '../../css/app.css';
import './style.css';

/**
 * User registration view
 */
class RegisterView extends View {
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
        this.nameInp = ge('name');
        this.form = ge('regfrm');
        if (!this.loginInp || !this.passwordInp || !this.nameInp || !this.form) {
            throw new Error('Failed to initialize Login view');
        }

        this.loginInp.addEventListener('input', this.onLoginInput.bind(this));
        this.passwordInp.addEventListener('input', this.onPasswordInput.bind(this));
        this.nameInp.addEventListener('input', this.onNameInput.bind(this));
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

window.view = new RegisterView(window.app);