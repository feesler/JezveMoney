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

export const selectDateLocale = async (locale) => {
    await test(`Select date locale ${locale}`, async () => {
        await checkNavigation();

        App.state.updateSettings({
            date_locale: locale,
        });

        await App.view.selectDateLocale(locale);

        return App.state.fetchAndTest();
    });
};

export const selectDecimalLocale = async (locale) => {
    await test(`Select decimal locale ${locale}`, async () => {
        await checkNavigation();

        App.state.updateSettings({
            decimal_locale: locale,
        });

        await App.view.selectDecimalLocale(locale);

        return App.state.fetchAndTest();
    });
};

export const testDateLocales = async (locales, action) => {
    const initialLocale = App.state.getDateFormatLocale();
    const remainLocales = locales.filter((locale) => locale !== initialLocale);

    for (const locale of remainLocales) {
        await selectDateLocale(locale);
        await action(locale);
    }

    await selectDateLocale(initialLocale);
    await action(initialLocale);
};

export const testDecimalLocales = async (locales, action) => {
    const initialLocale = App.state.getDecimalFormatLocale();
    const remainLocales = locales.filter((locale) => locale !== initialLocale);

    for (const locale of remainLocales) {
        await selectDecimalLocale(locale);
        await action(locale);
    }

    await selectDecimalLocale(initialLocale);
    await action(initialLocale);
};
