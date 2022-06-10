import { test } from 'jezve-test';
import { LoginView } from '../view/LoginView.js';
import { MainView } from '../view/MainView.js';
import { App } from '../Application.js';
import { RegisterView } from '../view/RegisterView.js';
import { ProfileView } from '../view/ProfileView.js';
import { AboutView } from '../view/AboutView.js';

const checkLoginNavigation = async () => {
    if (App.view.isUserLoggedIn()) {
        await App.view.logoutUser();
    }

    if (!(App.view instanceof LoginView)) {
        throw new Error('Wrong page');
    }
};

const checkProfileNavigation = async () => {
    await App.view.goToProfile();
    if (!(App.view instanceof ProfileView)) {
        throw new Error('Wrong page');
    }
};

export const relogin = async ({ login, password }) => {
    await checkLoginNavigation();

    await App.view.inputLogin(login);
    await App.view.inputPassword(password);

    const validInput = App.view.isValid();
    await App.view.submit();

    if (validInput) {
        App.view.expectedState = { msgPopup: null };
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
            msgPopup: { success: true, message: 'You successfully registered.' },
        };

        await test('User registration', () => App.view.checkState());
        await App.view.closeNotification();

        await App.view.inputLogin(login);
        await App.view.inputPassword(password);
        await App.view.submit();
        App.view.expectedState = { msgPopup: null };
        await test('Login with new account', () => App.view.checkState());

        await App.state.fetch();
    } else {
        await test('User registration with invalid data', () => App.view instanceof RegisterView);
        await App.view.goToLogin();
    }
};

export const resetAccounts = async () => {
    App.state.resetAccounts();

    await App.view.goToProfile();
    await App.view.resetAccounts();

    App.view.expectedState = {
        msgPopup: { success: true, message: 'Accounts successfully reseted' },
    };
    await test('Reset accounts data', () => App.view.checkState());

    await App.view.closeNotification();
    await App.goToMainView();

    App.view.expectedState = MainView.render(App.state);
    await test('Main view update', () => App.view.checkState());
};

export const resetAll = async () => {
    App.state.resetAll();

    await App.view.goToProfile();
    await App.view.resetAll();

    App.view.expectedState = {
        msgPopup: { success: true, message: 'All data successfully reseted.' },
    };
    await test('Reset all data', () => App.view.checkState());

    await App.view.closeNotification();
    await App.goToMainView();

    App.view.expectedState = MainView.render(App.state);
    await test('Main view update', () => App.view.checkState());
};

export const changeName = async (newName) => {
    await test(`Change user name ('${newName}')`, async () => {
        await checkProfileNavigation();

        const validInput = newName && newName.length > 0 && newName !== App.state.profile.name;

        await App.view.changeName(newName);

        if (validInput) {
            App.state.changeName(newName);

            App.view.expectedState = {
                msgPopup: { success: true, message: 'User name successfully updated.' },
                header: { user: { name: newName } },
            };

            await App.view.checkState();
            await App.view.closeNotification();
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
                msgPopup: { success: true, message: 'Password successfully updated.' },
            };

            await App.view.checkState();
            await App.view.closeNotification();

            await App.view.logoutUser();
            await App.view.inputLogin(App.state.profile.login);
            await App.view.inputPassword(newPassword);
            await App.view.submit();
            App.view.expectedState = { msgPopup: null };
            return App.view.checkState();
        }

        return App.view instanceof ProfileView;
    });
};

export const deleteProfile = async () => {
    await App.view.goToProfile();

    await App.view.deleteProfile();
    App.view.expectedState = {
        msgPopup: { success: true, message: 'Your profile is successfully deleted.' },
    };
    await test('Delete profile', () => App.view.checkState());

    await App.view.closeNotification();
};

export const openAbout = async () => {
    await test('About page', async () => {
        await App.view.goToAbout();
        if (!(App.view instanceof AboutView)) {
            throw new Error('Invalid view');
        }

        return true;
    });
};
