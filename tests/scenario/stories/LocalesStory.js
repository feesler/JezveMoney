import { setBlock, TestStory } from 'jezve-test';
import { App } from '../../Application.js';
import { translationTest, changeLocaleTest } from '../actions/locale.js';

export class LocalesStory extends TestStory {
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
        setBlock('Locales', 1);

        await this.translation();
        await this.changeLocale();
    }

    async translation() {
        setBlock('Locale translation', 2);

        await translationTest();
    }

    async changeLocale() {
        setBlock('Change locale', 2);

        await changeLocaleTest();
    }
}
