import { App } from '../../Application.js';
import { api } from '../../model/api.js';

export const createUserCurrencies = async () => {
    const data = [{
        curr_id: App.scenario.RUB,
    }, {
        curr_id: App.scenario.USD,
    }, {
        curr_id: App.scenario.EUR,
    }, {
        curr_id: App.scenario.PLN,
    }, {
        curr_id: App.scenario.KRW,
    }];

    await api.usercurrency.create({ data });

    await App.state.fetch();
};
