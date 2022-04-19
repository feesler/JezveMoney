import { AppView } from './AppView.js';
import { MainView } from './MainView.js';
import { RegisterView } from './RegisterView.js';
import { App } from '../Application.js';
import { InputRow } from './component/InputRow.js';
import { navigation, query, click } from '../env.js';

/** Log in view class */
export class LoginView extends AppView {
    async parseContent() {
        const res = {
            loginInp: await InputRow.create(this, await query('#login-inp-block')),
            passwordInp: await InputRow.create(this, await query('#pwd-inp-block')),
            submitBtn: await query('.form-controls .btn.submit-btn'),
            registerLink: await query('.form-controls .alter_link > a'),
        };

        if (!res.loginInp || !res.passwordInp || !res.submitBtn || !res.registerLink) {
            throw new Error('Invalid structure of login view');
        }

        return res;
    }

    async buildModel(cont) {
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
            if (!(App.view instanceof MainView)) {
                throw new Error('Fail to login');
            }
        } else {
            await this.performAction(action);
        }
    }

    async goToRegistration() {
        await navigation(() => click(this.content.registerLink));

        if (!(App.view instanceof RegisterView)) {
            throw new Error('Unexpected page');
        }
    }
}
