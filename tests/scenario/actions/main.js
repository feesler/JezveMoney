import { test } from 'jezve-test';
import { MainView } from '../../view/MainView.js';
import { App } from '../../Application.js';

/** Navigate to persons list page */
const checkNavigation = async () => {
    if (!(App.view instanceof MainView)) {
        await App.goToMainView();
    }
};

/** Toggle shows/hides hidden accounts */
export const toggleHiddenAccounts = async () => {
    await test('Toggle show/hide hidden accounts', async () => {
        await checkNavigation();
        return App.view.toggleHiddenAccounts();
    });
};

/** Toggle shows/hides hidden persons */
export const toggleHiddenPersons = async () => {
    await test('Toggle show/hide hidden persons', async () => {
        await checkNavigation();
        return App.view.toggleHiddenPersons();
    });
};
