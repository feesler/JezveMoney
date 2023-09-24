import {
    assert,
    navigation,
    query,
    click,
} from 'jezve-test';
import { AppView } from './AppView.js';
import { MainView } from './MainView.js';
import { RegisterView } from './RegisterView.js';
import { App } from '../Application.js';
import { InputField } from './component/Fields/InputField.js';

/** Log in view class */
export class LoginView extends AppView {
    async parseContent() {
        const res = {
            loginInp: await InputField.create(this, await query('#loginField')),
            passwordInp: await InputField.create(this, await query('#passwordField')),
            submitBtn: await query('.form-controls .submit-btn'),
            registerLink: await query('.form-controls .alter-link'),
        };

        assert(
            res.loginInp
            && res.passwordInp
            && res.submitBtn
            && res.registerLink,
            'Invalid structure of login view',
        );

        return res;
    }

    buildModel(cont) {
        const res = {};

        res.login = cont.loginInp.content.value;
        res.password = cont.passwordInp.content.value;

        return res;
    }

    isValid() {
        return (typeof this.model.login === 'string'
            && this.model.login.length > 0
            && typeof this.model.password === 'string'
            && this.model.password.length > 0);
    }

    async inputLogin(val) {
        await this.performAction(() => this.content.loginInp.input(val));
    }

    async inputPassword(val) {
        await this.performAction(() => this.content.passwordInp.input(val));
    }

    async submit() {
        const action = () => click(this.content.submitBtn);

        if (this.isValid()) {
            await navigation(action);
            assert.instanceOf(App.view, MainView, 'Fail to login');
        } else {
            await this.performAction(action);
        }
    }

    async goToRegistration() {
        await navigation(() => click(this.content.registerLink));

        assert.instanceOf(App.view, RegisterView, 'Unexpected page');
    }
}
