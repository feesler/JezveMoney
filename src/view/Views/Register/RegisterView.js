import 'jezvejs/style';
import { setEvents } from 'jezvejs';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { View } from '../../js/View.js';
import { createStore } from '../../js/store.js';
import { actions, reducer } from './reducer.js';
import '../../Components/Field/style.scss';
import './style.scss';

/**
 * User registration view
 */
class RegisterView extends View {
    constructor(...args) {
        super(...args);

        const initialState = {
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
            'nameInp',
        ]);

        setEvents(this.form, { submit: (e) => this.onSubmit(e) });
        setEvents(this.loginInp, { input: () => this.onLoginInput() });
        setEvents(this.passwordInp, { input: () => this.onPasswordInput() });
        setEvents(this.nameInp, { input: () => this.onNameInput() });

        this.subscribeToStore(this.store);
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
     * Password field input event handler
     */
    onNameInput() {
        const { value } = this.nameInp;
        this.store.dispatch(actions.changeName(value));
    }

    /**
     * Log in form submit event handler
     */
    onSubmit(e) {
        const state = this.store.getState();
        const { login, name, password } = state.form;

        if (login.length === 0) {
            this.store.dispatch(actions.invalidateLoginField());
        }

        if (name.length === 0) {
            this.store.dispatch(actions.invalidateNameField());
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

        // Name input
        this.nameInp.value = state.form.name;
        window.app.setValidation('name-inp-block', state.validation.name);

        // Password input
        this.passwordInp.value = state.form.password;
        window.app.setValidation('pwd-inp-block', state.validation.password);
    }
}

window.app = new Application(window.appProps);
window.app.createView(RegisterView);
