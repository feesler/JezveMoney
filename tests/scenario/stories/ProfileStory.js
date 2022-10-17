import { setBlock, TestStory } from 'jezve-test';
import * as ProfileTests from '../../run/profile.js';
import { App } from '../../Application.js';

const resetAllOptions = {
    accounts: true,
    persons: true,
    transactions: true,
    importtpl: true,
    importrules: true,
};

export class ProfileStory extends TestStory {
    async beforeRun() {
        await App.scenario.removeUsers();
        await App.scenario.prepareTestUser();

        await App.state.fetch();
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

        await ProfileTests.register(App.config.newUser);
        await ProfileTests.deleteProfile();

        await App.scenario.runner.runGroup(ProfileTests.register, [{
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

        await App.scenario.runner.runGroup(ProfileTests.relogin, [{
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

        await App.scenario.runner.runGroup(ProfileTests.changeName, [
            '',
            origUserName,
            '^^&&>>',
            origUserName,
        ]);
    }

    async changePassword() {
        setBlock('Change password', 2);

        const tmpPassword = 'test123';

        await App.scenario.runner.runGroup(ProfileTests.changePass, [{
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

        await ProfileTests.resetData(resetAllOptions);
    }

    async resetWithData() {
        setBlock('Reset precreated data', 2);

        await App.scenario.createTestData();
        await App.scenario.runner.runGroup(ProfileTests.resetData, [
            { accounts: true },
            resetAllOptions,
        ]);
    }

    async about() {
        setBlock('About view', 2);

        await ProfileTests.openAbout();
    }
}
