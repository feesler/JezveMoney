import { App } from '../../Application.js';
import { api } from '../../model/api.js';

export const createUserCurrencies = async () => {
    const userCurrenciesList = [{
        curr_id: App.scenario.RUB,
        flags: 0,
    }, {
        curr_id: App.scenario.USD,
        flags: 0,
    }, {
        curr_id: App.scenario.EUR,
        flags: 0,
    }, {
        curr_id: App.scenario.PLN,
        flags: 0,
    }, {
        curr_id: App.scenario.KRW,
        flags: 0,
    }];

    await api.usercurrency.createMultiple(userCurrenciesList);

    await App.state.fetch();
};
