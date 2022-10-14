import { App } from '../../Application.js';
import { ACCOUNT_HIDDEN } from '../../model/AccountsList.js';
import { api } from '../../model/api.js';

export const createAccounts = async () => {
    const { RUB, USD, EUR } = App.scenario;

    const accList = [{
        name: 'ACC_3',
        curr_id: RUB,
        initbalance: '500.99',
        icon_id: 2,
        flags: 0,
    }, {
        name: 'ACC_RUB',
        curr_id: RUB,
        initbalance: '500.99',
        icon_id: 5,
        flags: 0,
    }, {
        name: 'ACC_USD',
        curr_id: USD,
        initbalance: '500.99',
        icon_id: 4,
        flags: 0,
    }, {
        name: 'ACC_EUR',
        curr_id: EUR,
        initbalance: '10000.99',
        icon_id: 3,
        flags: 0,
    }, {
        name: 'CARD_RUB',
        curr_id: RUB,
        initbalance: '35000.40',
        icon_id: 3,
        flags: 0,
    }, {
        name: 'HIDDEN_ACC',
        curr_id: RUB,
        initbalance: '100',
        icon_id: 0,
        flags: ACCOUNT_HIDDEN,
    }];

    const createRes = await api.account.createMultiple(accList);
    [
        App.scenario.ACC_3,
        App.scenario.ACC_RUB,
        App.scenario.ACC_USD,
        App.scenario.ACC_EUR,
        App.scenario.CARD_RUB,
        App.scenario.HIDDEN_ACC,
    ] = createRes.ids;

    await App.state.fetch();
};
