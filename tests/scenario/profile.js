import { setBlock } from 'jezve-test';
import * as ProfileTests from '../run/profile.js';
import { App } from '../Application.js';

let scenario = null;

export const profileTests = {
    /** Initialize tests */
    init(scenarioInstance) {
        scenario = scenarioInstance;
    },

    /** Run account view tests */
    async run() {
        setBlock('Profile tests', 1);

        await App.state.fetch();

        const origUserName = App.state.profile.name;
        const tmpPassword = 'test123';

        // Registration tests
        await ProfileTests.register(App.config.newUser);
        await ProfileTests.deleteProfile();

        await scenario.runner.runGroup(ProfileTests.register, [{
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

        // Login tests
        await scenario.runner.runGroup(ProfileTests.relogin, [{
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

        await ProfileTests.resetAll();

        await ProfileTests.openAbout();

        // Change name tests
        await scenario.runner.runGroup(ProfileTests.changeName, [
            '',
            origUserName,
            '^^&&>>',
            origUserName,
        ]);

        // Change password tests
        await scenario.runner.runGroup(ProfileTests.changePass, [{
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
    },

    /** Run profile tests with transactions */
    async runPostTransaction() {
        setBlock('Profile with transactions tests', 1);

        await ProfileTests.resetAccounts();
        await ProfileTests.resetAll();
    },

    /** Initialize and run tests */
    async initAndRun(scenarioInstance) {
        this.init(scenarioInstance);
        await this.run();
    },
};
