import { test, assert } from 'jezve-test';
import { LoginView } from '../view/LoginView.js';
import { MainView } from '../view/MainView.js';
import { App } from '../Application.js';
import { RegisterView } from '../view/RegisterView.js';
import { ProfileView } from '../view/ProfileView.js';
import { AboutView } from '../view/AboutView.js';
import { __ } from '../model/locale.js';

const checkLoginNavigation = async () => {
    if (App.view.isUserLoggedIn()) {
        await App.view.logoutUser();
    }

    assert.instanceOf(App.view, LoginView, 'Invalid view');
};

const checkProfileNavigation = async () => {
    await App.view.goToProfile();
    assert.instanceOf(App.view, ProfileView, 'Invalid view');
};

export const relogin = async ({ login, password }) => {
    await checkLoginNavigation();

    await App.view.inputLogin(login);
    await App.view.inputPassword(password);

    const validInput = App.view.isValid();
    await App.view.submit();

    if (validInput) {
        App.view.expectedState = { notification: null };
        await test('Test user login', () => App.view.checkState());

        App.state.setUserProfile({ login, password });
        App.state.resetAll();
        await App.state.fetch();
    } else {
        await test('User login with invalid data', () => App.view instanceof LoginView);
    }
};

export const register = async ({ login, name, password }) => {
    await checkLoginNavigation();
    await App.view.goToRegistration();

    await App.view.inputLogin(login);
    await App.view.inputName(name);
    await App.view.inputPassword(password);

    const validInput = App.view.isValid();
    await App.view.submit();

    if (validInput) {
        App.view.expectedState = {
            notification: { success: true, message: __('MSG_REGISTER', App.view.locale) },
        };

        await test('User registration', () => App.view.checkState());
        await App.view.closeNotification();

        await App.view.inputLogin(login);
        await App.view.inputPassword(password);
        await App.view.submit();
        App.view.expectedState = { notification: null };
        await test('Login with new account', () => App.view.checkState());

        await App.state.fetch();
    } else {
        await test('User registration with invalid data', () => App.view instanceof RegisterView);
        await App.view.goToLogin();
    }
};

export const resetData = async (options = {}) => {
    App.state.resetData(options);

    await App.view.goToProfile();
    await App.view.resetData(options);

    App.view.expectedState = {
        notification: { success: true, message: __('MSG_PROFILE_RESET', App.view.locale) },
    };
    await test('Reset data', () => App.view.checkState());

    await App.view.closeNotification();
    await App.goToMainView();
    await App.view.waitForLoad();

    App.view.expectedState = MainView.render(App.state);
    await test('Main view update', () => App.view.checkState());
};

export const changeName = async (newName) => {
    await test(`Change user name ('${newName}')`, async () => {
        await checkProfileNavigation();

        const validInput = newName && newName.length > 0;
        const nameChanged = newName !== App.state.profile.name;

        await App.view.changeName(newName);

        if (validInput) {
            App.state.changeName(newName);

            App.view.expectedState = {
                header: { userBtn: { title: newName } },
            };

            if (nameChanged) {
                App.view.expectedState.notification = {
                    success: true,
                    message: __('MSG_PROFILE_NAME', App.view.locale),
                };
            }

            App.view.checkState();

            if (nameChanged) {
                await App.view.closeNotification();
            }
        }

        return App.state.fetchAndTest();
    });
};

export const changePass = async ({ oldPassword, newPassword }) => {
    await test(`Change password ('${oldPassword}' > '${newPassword}')`, async () => {
        await checkProfileNavigation();

        const validInput = oldPassword
            && oldPassword.length > 0
            && newPassword
            && newPassword.length > 0
            && oldPassword !== newPassword;

        await App.view.changePassword(oldPassword, newPassword);
        if (validInput) {
            App.view.expectedState = {
                notification: { success: true, message: __('MSG_PROFILE_PASSWORD', App.view.locale) },
            };

            App.view.checkState();
            await App.view.closeNotification();

            await App.view.logoutUser();
            await App.view.inputLogin(App.state.profile.login);
            await App.view.inputPassword(newPassword);
            await App.view.submit();
            App.view.expectedState = { notification: null };
            return App.view.checkState();
        }

        return App.view instanceof ProfileView;
    });
};

export const deleteProfile = async () => {
    await App.view.goToProfile();

    await App.view.deleteProfile();
    App.view.expectedState = {
        notification: { success: true, message: __('MSG_PROFILE_DELETED', App.view.locale) },
    };
    await test('Delete profile', () => App.view.checkState());

    await App.view.closeNotification();
};

export const openAbout = async () => {
    await test('About page', async () => {
        await App.view.navigateToAbout();
        assert.instanceOf(App.view, AboutView, 'Invalid view');

        return true;
    });
};
