import { setBlock } from 'jezve-test';
import * as ProfileTests from '../run/profile.js';
import { App } from '../Application.js';

const resetAllOptions = {
    accounts: true,
    persons: true,
    transactions: true,
    importtpl: true,
    importrules: true,
};

const registration = async () => {
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
};

const login = async () => {
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
};

const changeName = async () => {
    setBlock('Change name', 2);

    const origUserName = App.state.profile.name;

    await App.scenario.runner.runGroup(ProfileTests.changeName, [
        '',
        origUserName,
        '^^&&>>',
        origUserName,
    ]);
};

const changePassword = async () => {
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
};

const reset = async () => {
    setBlock('Reset data', 2);

    await ProfileTests.resetData(resetAllOptions);
};

const resetWithData = async () => {
    setBlock('Reset data', 2);

    await App.scenario.runner.runGroup(ProfileTests.resetData, [
        { accounts: true },
        resetAllOptions,
    ]);
};

const about = async () => {
    setBlock('About view', 2);

    await ProfileTests.openAbout();
};

const prepare = async () => {
    await App.scenario.removeUsers();
    await App.scenario.prepareTestUser();

    await App.state.fetch();
};

/** Registration, Login and Profile view tests */
export const profileTests = {
    async run() {
        setBlock('Profile tests', 1);

        await prepare();

        await registration();
        await login();
        await reset();
        await about();
        await changeName();
        await changePassword();

        await App.scenario.createTestData();
        await resetWithData();
    },
};
