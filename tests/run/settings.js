import { test, assert, asArray } from 'jezve-test';
import { App } from '../Application.js';
import { SettingsView } from '../view/SettingsView.js';

const checkNavigation = async () => {
    if (!(App.view instanceof SettingsView)) {
        await App.view.goToSettings();
    }
};

export const addCurrencyById = async (id) => {
    const currency = App.currency.getItem(id);
    assert(currency, `Invalid currency id: ${id}`);

    await test(`Add currency ${currency.code}`, async () => {
        await checkNavigation();

        App.state.createUserCurrency({ curr_id: currency.id, flags: 0 });

        await App.view.addCurrencyById(id);

        return App.state.fetchAndTest();
    });
};

export const deleteCurrencyFromContextMenu = async (index) => {
    await test(`Delete currency from context menu [${index}]`, async () => {
        await checkNavigation();

        await App.view.deleteCurrencyFromContextMenu(index);

        const id = App.state.getUserCurrenciesByIndexes(index, true);
        App.state.deleteUserCurrencies({ id });

        return App.state.fetchAndTest();
    });
};

export const del = async (index) => {
    const indexes = asArray(index);

    await test(`Delete currencies [${indexes.join()}]`, async () => {
        await checkNavigation();

        await App.view.deleteCurrencies(indexes);

        const id = App.state.getUserCurrenciesByIndexes(indexes, true);
        App.state.deleteUserCurrencies({ id });

        return App.state.fetchAndTest();
    });
};
