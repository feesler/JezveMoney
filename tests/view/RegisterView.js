import {
    assert,
    query,
    navigation,
    click,
} from 'jezve-test';
import { AppView } from './AppView.js';
import { LoginView } from './LoginView.js';
import { App } from '../Application.js';
import { InputRow } from './component/InputRow.js';

/** Registration view class */
export class RegisterView extends AppView {
    async parseContent() {
        const res = {
            loginInp: await InputRow.create(this, await query('#loginField')),
            nameInp: await InputRow.create(this, await query('#nameField')),
            passwordInp: await InputRow.create(this, await query('#passwordField')),
            submitBtn: await query('.form-controls .submit-btn'),
            loginLink: await query('.form-controls .alter-link'),
        };

        assert(
            res.loginInp
            && res.nameInp
            && res.passwordInp
            && res.submitBtn
            && res.loginLink,
            'Invalid structure of register view',
        );

        return res;
    }

    buildModel(cont) {
        const res = {};

        res.login = cont.loginInp.content.value;
        res.name = cont.nameInp.content.value;
        res.password = cont.passwordInp.content.value;

        return res;
    }

    isValid() {
        return (
            typeof this.model.login === 'string'
            && this.model.login.length > 0
            && typeof this.model.name === 'string'
            && this.model.name.length > 0 && typeof this.model.password === 'string'
            && this.model.password.length > 0
        );
    }

    async inputLogin(val) {
        await this.performAction(() => this.content.loginInp.input(val));
    }

    async inputName(val) {
        await this.performAction(() => this.content.nameInp.input(val));
    }

    async inputPassword(val) {
        await this.performAction(() => this.content.passwordInp.input(val));
    }

    async submit() {
        const action = () => click(this.content.submitBtn);

        if (this.isValid()) {
            await navigation(action);
            assert.instanceOf(App.view, LoginView, 'Unexpected view');
        } else {
            await this.performAction(action);
        }
    }

    async goToLogin() {
        await navigation(() => click(this.content.loginLink));

        assert.instanceOf(App.view, LoginView, 'Unexpected page');
    }
}
