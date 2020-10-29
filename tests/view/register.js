import { TestView } from './testview.js';
import { LoginView } from './login.js';
import { App } from '../app.js';
import { InputRow } from './component/inputrow.js';

/** Registration view class */
export class RegisterView extends TestView {
    async parseContent() {
        const res = {
            loginInp: await InputRow.create(this, await this.query('#login-inp-block')),
            nameInp: await InputRow.create(this, await this.query('#name-inp-block')),
            passwordInp: await InputRow.create(this, await this.query('#pwd-inp-block')),
            submitBtn: await this.query('.form-controls .btn.submit-btn'),
            loginLink: await this.query('.form-controls .alter_link > a'),
        };

        if (
            !res.loginInp
            || !res.nameInp
            || !res.passwordInp
            || !res.submitBtn
            || !res.loginLink
        ) {
            throw new Error('Invalid structure of register view');
        }

        return res;
    }

    async buildModel(cont) {
        const res = {};

        res.login = cont.loginInp.value;
        res.name = cont.nameInp.value;
        res.password = cont.passwordInp.value;

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
        const action = () => this.click(this.content.submitBtn);

        if (this.isValid()) {
            await this.navigation(action);
            if (!(App.view instanceof LoginView)) {
                throw new Error('Unexpected view');
            }
        } else {
            await this.performAction(action);
        }
    }

    async goToLogin() {
        await this.navigation(() => this.click(this.content.loginLink));

        if (!(App.view instanceof LoginView)) {
            throw new Error('Unexpected page');
        }
    }
}
