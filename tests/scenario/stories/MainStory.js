import { setBlock, TestStory } from 'jezve-test';
import * as Actions from '../actions/main.js';
import { App } from '../../Application.js';

export class MainStory extends TestStory {
    async beforeRun() {
        await App.scenario.prepareTestUser();
        await App.scenario.resetData({
            accounts: true,
            persons: true,
            categories: true,
            currencies: true,
        });
        await App.scenario.createTestData();

        await App.goToMainView();
    }

    async run() {
        setBlock('Main view', 1);

        await this.toggleHiddenAccounts();
        await this.toggleHiddenPersons();
    }

    async toggleHiddenAccounts() {
        setBlock('Toggle show/hide hidden accounts', 1);

        await Actions.toggleHiddenAccounts();
        await Actions.toggleHiddenAccounts();
        await Actions.toggleHiddenAccounts();
        await Actions.toggleHiddenPersons();
        await Actions.toggleHiddenPersons();
        await Actions.toggleHiddenPersons();
    }

    async toggleHiddenPersons() {
        setBlock('Toggle show/hide hidden persons', 1);

        await Actions.toggleHiddenPersons();
        await Actions.toggleHiddenPersons();
        await Actions.toggleHiddenPersons();
    }
}
