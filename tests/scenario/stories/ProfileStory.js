import { setBlock, TestStory } from 'jezve-test';
import * as Actions from '../actions/profile.js';
import { App } from '../../Application.js';

const resetAllOptions = {
    accounts: true,
    persons: true,
    categories: true,
    transactions: true,
    schedule: true,
    importtpl: true,
    importrules: true,
};

export class ProfileStory extends TestStory {
    async beforeRun() {
        await App.scenario.removeUsers();
        await App.scenario.prepareTestUser();
    }

    async run() {
        setBlock('Profile tests', 1);

        await this.registration();
        await this.login();
        await this.reset();
        await this.about();
        await this.changeName();
        await this.changePassword();
        await this.resetWithData();
    }

    async registration() {
        setBlock('User registration', 2);

        await Actions.register(App.config.newUser);
        await Actions.deleteProfile();

        await App.scenario.runner.runGroup(Actions.register, [{
            login: '',
            name: '',
            password: '',
        }, {
            login: '',
            name: App.config.newUser.name,
            password: App.config.newUser.password,
        }, {
            login: App.config.newUser.login,
            name: '',
            password: App.config.newUser.password,
        }, {
            login: App.config.newUser.login,
            name: App.config.newUser.name,
            password: '',
        }]);
    }

    async login() {
        setBlock('User login', 2);

        await App.scenario.runner.runGroup(Actions.relogin, [{
            login: App.config.testUser.login,
            password: '',
        }, {
            login: '',
            password: App.config.testUser.password,
        }, {
            login: '',
            password: '',
        }, {
            ...App.config.testUser,
        }]);
    }

    async changeName() {
        setBlock('Change name', 2);

        const origUserName = App.state.profile.name;

        await App.scenario.runner.runGroup(Actions.changeName, [
            '',
            origUserName,
            '^^&&>>',
            origUserName,
        ]);
    }

    async changePassword() {
        setBlock('Change password', 2);

        const tmpPassword = 'test123';

        await App.scenario.runner.runGroup(Actions.changePass, [{
            oldPassword: '',
            newPassword: '',
        }, {
            oldPassword: '123',
            newPassword: '',
        }, {
            oldPassword: '',
            newPassword: '123',
        }, {
            oldPassword: App.config.testUser.password,
            newPassword: tmpPassword,
        }, {
            oldPassword: tmpPassword,
            newPassword: App.config.testUser.password,
        }]);
    }

    async reset() {
        setBlock('Reset data', 2);

        await Actions.resetData(resetAllOptions);
    }

    async resetWithData() {
        setBlock('Reset precreated data', 2);

        await App.scenario.resetData({
            accounts: true,
            persons: true,
            categories: true,
            currencies: true,
        });
        await App.scenario.createTestData();

        await App.scenario.runner.runGroup(Actions.resetData, [
            { schedule: true },
            { accounts: true },
            resetAllOptions,
        ]);
    }

    async about() {
        setBlock('About view', 2);

        await Actions.openAbout();
        await Actions.logout();
        await Actions.goToRegistration();
        await Actions.openAbout();
        await App.view.clickByLogo();
        await Actions.relogin(App.config.testUser);
    }
}
