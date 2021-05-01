import { test } from 'jezve-test';
import { api } from '../model/api.js';
import { ApiRequestError } from '../error/apirequest.js';
import { App } from '../app.js';

export async function deleteUserIfExist({ login }) {
    const users = await api.user.list();
    const user = users.find((item) => item.login === login);
    if (user) {
        await api.user.del(user.id);
    }
}

/**
 * Register new user and try to login
 * @param {Object} userData - user data object: { login, password, name }
 */
export async function registerAndLogin(userData) {
    await test('User registration', async () => {
        await api.user.logout();

        if (!await api.user.register(userData)) {
            throw new Error('Fail to register user');
        }

        if (!await api.user.login(userData)) {
            throw new Error('Fail to register user');
        }

        App.state.setUserProfile(userData);
        App.state.resetAll();
        return App.state.fetchAndTest();
    });
}

/**
 * Try to login user
 * @param {Object} userData - user data object: { login, password }
 */
export async function loginTest(userData) {
    await test('Login user', async () => {
        const resExpected = (userData.login.length > 0 && userData.password.length > 0);
        try {
            const loginRes = await api.user.login(userData);
            if (resExpected !== loginRes) {
                return false;
            }
        } catch (e) {
            if (!(e instanceof ApiRequestError) || resExpected) {
                throw e;
            }
        }

        await App.state.fetch();

        return true;
    });
}

/** Change user name and check update in profile */
export async function changeName(name) {
    await test('Change user name', async () => {
        const resExpected = name.length > 0 && name !== App.state.profile.name;

        try {
            const chNameRes = await api.profile.changeName({ name });
            if (resExpected !== chNameRes) {
                return false;
            }
        } catch (e) {
            if (!(e instanceof ApiRequestError) || resExpected) {
                throw e;
            }
        }

        if (resExpected) {
            App.state.changeName(name);
            return App.state.fetchAndTest();
        }

        return true;
    });
}

export async function changePassword({ user, newPassword }) {
    await test('Change user password', async () => {
        await api.profile.changePassword({ oldPassword: user.password, newPassword });

        await api.user.logout();
        await api.user.login({
            login: user.login,
            password: newPassword,
        });

        return api.profile.changePassword({ oldPassword: newPassword, newPassword: user.password });
    });
}

export async function resetAccounts() {
    await test('Reset accounts', async () => {
        await api.account.reset();

        App.state.resetAccounts();
        return true;
    });
}

export async function resetAll() {
    await test('Reset all', async () => {
        await api.profile.reset();

        App.state.resetAll();
        return true;
    });
}

export async function deleteProfile() {
    await test('Delete user profile', async () => {
        await api.profile.del();

        App.state.deleteProfile();
        return true;
    });
}
