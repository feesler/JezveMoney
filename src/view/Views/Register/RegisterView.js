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
    constructor(...args) {
        super(...args);

        this.state = {
            form: {
                login: '',
                name: '',
                password: '',
            },
            validation: {
                login: true,
                name: true,
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
     * Password field input event handler
     */
    onNameInput() {
        this.state.form.name = this.nameInp.value;
        this.state.validation.name = true;
        this.render(this.state);
    }

    /**
     * Log in form submit event handler
     */
    onSubmit(e) {
        const { login, name, password } = this.state.form;
        let valid = true;

        if (login.length === 0) {
            this.state.validation.login = false;
            valid = false;
        }

        if (name.length === 0) {
            this.state.validation.name = false;
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
            this.clearBlockValidation('login-inp-block');
        } else {
            this.invalidateBlock('login-inp-block');
        }

        // Name input
        if (state.validation.name) {
            this.clearBlockValidation('name-inp-block');
        } else {
            this.invalidateBlock('name-inp-block');
        }

        // Password input
        if (state.validation.password) {
            this.clearBlockValidation('pwd-inp-block');
        } else {
            this.invalidateBlock('pwd-inp-block');
        }
    }
}

window.app = new Application(window.appProps);
window.app.createView(RegisterView);
