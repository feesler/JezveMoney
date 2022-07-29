import { test, assert } from 'jezve-test';
import { api } from '../../model/api.js';
import { ApiRequestError } from '../../error/ApiRequestError.js';
import { App } from '../../Application.js';

export const deleteUserIfExist = async ({ login }) => {
    const users = await api.user.list();
    const user = users.find((item) => item.login === login);
    if (user) {
        await api.user.del(user.id);
    }
};

/**
 * Register new user and try to login
 * @param {Object} userData - user data object: { login, password, name }
 */
export const registerAndLogin = async (userData) => {
    await test('User registration', async () => {
        await api.user.logout();

        const registerResult = await api.user.register(userData);
        assert(registerResult, 'Fail to register user');

        const loginResult = await api.user.login(userData);
        assert(loginResult, 'Fail to register user');

        App.state.setUserProfile(userData);
        App.state.resetAll();
        return App.state.fetchAndTest();
    });
};

/**
 * Try to login user
 * @param {Object} userData - user data object: { login, password }
 */
export const loginTest = async (userData) => {
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
};

/** Change user name and check update in profile */
export const changeName = async (name) => {
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
};

export const changePassword = async ({ user, newPassword }) => {
    await test('Change user password', async () => {
        await api.profile.changePassword({ oldPassword: user.password, newPassword });

        await api.user.logout();
        await api.user.login({
            login: user.login,
            password: newPassword,
        });

        return api.profile.changePassword({ oldPassword: newPassword, newPassword: user.password });
    });
};

export const resetData = async (options = {}) => {
    await test('Reset data', async () => {
        await api.profile.resetData(options);

        App.state.resetData(options);
        return App.state.fetchAndTest();
    });
};

export const deleteProfile = async () => {
    await test('Delete user profile', async () => {
        await api.profile.del();

        App.state.deleteProfile();
        return true;
    });
};
