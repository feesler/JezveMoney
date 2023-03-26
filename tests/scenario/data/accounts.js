import { App } from '../../Application.js';
import {
    ACCOUNT_HIDDEN,
    ACCOUNT_TYPE_CASH,
    ACCOUNT_TYPE_CREDIT,
    ACCOUNT_TYPE_DEBIT_CARD,
    ACCOUNT_TYPE_OTHER,
} from '../../model/AccountsList.js';
import { api } from '../../model/api.js';

export const createAccounts = async () => {
    const {
        RUB,
        USD,
        EUR,
        BTC,
    } = App.scenario;

    const accList = [{
        type: ACCOUNT_TYPE_OTHER,
        name: 'ACC_3',
        curr_id: RUB,
        initbalance: '500.99',
        limit: 0,
        icon_id: 2,
        flags: 0,
    }, {
        type: ACCOUNT_TYPE_CASH,
        name: 'ACC_RUB',
        curr_id: RUB,
        initbalance: '500.99',
        limit: 0,
        icon_id: 5,
        flags: 0,
    }, {
        type: ACCOUNT_TYPE_CASH,
        name: 'ACC_USD',
        curr_id: USD,
        initbalance: '500.99',
        limit: 0,
        icon_id: 4,
        flags: 0,
    }, {
        type: ACCOUNT_TYPE_CASH,
        name: 'ACC_EUR',
        curr_id: EUR,
        initbalance: '10000.99',
        limit: 0,
        icon_id: 3,
        flags: 0,
    }, {
        type: ACCOUNT_TYPE_DEBIT_CARD,
        name: 'CARD_RUB',
        curr_id: RUB,
        initbalance: '35000.40',
        limit: 0,
        icon_id: 3,
        flags: 0,
    }, {
        type: ACCOUNT_TYPE_CREDIT,
        name: 'HIDDEN_ACC',
        curr_id: RUB,
        initbalance: '100',
        limit: 0,
        icon_id: 0,
        flags: ACCOUNT_HIDDEN,
    }, {
        type: ACCOUNT_TYPE_DEBIT_CARD,
        name: 'ACC_BTC',
        curr_id: BTC,
        initbalance: '0.005746',
        limit: 0,
        icon_id: 5,
        flags: 0,
    }];

    const createRes = await api.account.createMultiple(accList);
    [
        App.scenario.ACC_3,
        App.scenario.ACC_RUB,
        App.scenario.ACC_USD,
        App.scenario.ACC_EUR,
        App.scenario.CARD_RUB,
        App.scenario.HIDDEN_ACC,
        App.scenario.ACC_BTC,
    ] = createRes.ids;

    await App.state.fetch();
};
