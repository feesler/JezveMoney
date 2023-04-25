import { setBlock, TestStory } from 'jezve-test';
import * as Actions from '../../actions/settings.js';
import { App } from '../../Application.js';

export class SettingsStory extends TestStory {
    async beforeRun() {
        await App.scenario.prepareTestUser();
        await App.scenario.resetData({
            currencies: true,
        });
    }

    async run() {
        setBlock('Settings tests', 1);

        await this.userCurrencies();
    }

    async userCurrencies() {
        setBlock('User currencies', 1);

        await this.addCurrencies();
        await this.deleteFromContextMenu();
        await this.del();
    }

    async addCurrencies() {
        setBlock('Add currencies', 2);

        await Actions.addCurrencyById(App.scenario.RUB);
        await Actions.addCurrencyById(App.scenario.USD);
        await Actions.addCurrencyById(App.scenario.EUR);
        await Actions.addCurrencyById(App.scenario.PLN);
        await Actions.addCurrencyById(App.scenario.KRW);
        await Actions.addCurrencyById(App.scenario.CNY);
        await Actions.addCurrencyById(App.scenario.JPY);
        await Actions.addCurrencyById(App.scenario.SEK);
    }

    async deleteFromContextMenu() {
        setBlock('Delete user currency from context menu', 2);

        await Actions.deleteCurrencyFromContextMenu(7);
    }

    async del() {
        setBlock('Delete currencies', 2);

        await Actions.del([0]);
        await Actions.del([0, 1]);
    }
}
