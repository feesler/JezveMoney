import { App } from '../../Application.js';
import {
    ACCOUNT_HIDDEN,
    ACCOUNT_TYPE_CASH,
    ACCOUNT_TYPE_CREDIT,
    ACCOUNT_TYPE_CREDIT_CARD,
    ACCOUNT_TYPE_DEBIT_CARD,
    ACCOUNT_TYPE_OTHER,
} from '../../model/AccountsList.js';

export const createAccounts = async () => {
    const {
        RUB,
        USD,
        EUR,
        BTC,
    } = App.scenario;

    const data = {
        ACC_3: {
            type: ACCOUNT_TYPE_OTHER,
            name: 'ACC_3',
            curr_id: RUB,
            initbalance: '500.99',
            icon_id: 2,
        },
        ACC_RUB: {
            type: ACCOUNT_TYPE_CASH,
            name: 'ACC_RUB',
            curr_id: RUB,
            initbalance: '500.99',
            icon_id: 5,
        },
        ACC_USD: {
            type: ACCOUNT_TYPE_CASH,
            name: 'ACC_USD',
            curr_id: USD,
            initbalance: '500.99',
            icon_id: 4,
        },
        ACC_EUR: {
            type: ACCOUNT_TYPE_CASH,
            name: 'ACC_EUR',
            curr_id: EUR,
            initbalance: '10000.99',
            icon_id: 3,
        },
        CARD_RUB: {
            type: ACCOUNT_TYPE_DEBIT_CARD,
            name: 'CARD_RUB',
            curr_id: RUB,
            initbalance: '35000.40',
            icon_id: 3,
        },
        HIDDEN_ACC: {
            type: ACCOUNT_TYPE_CREDIT,
            name: 'HIDDEN_ACC',
            curr_id: RUB,
            initbalance: '100',
            flags: ACCOUNT_HIDDEN,
        },
        ACC_BTC: {
            type: ACCOUNT_TYPE_DEBIT_CARD,
            name: 'ACC_BTC',
            curr_id: BTC,
            initbalance: '0.005746',
            icon_id: 5,
        },
        CREDIT_CARD: {
            type: ACCOUNT_TYPE_CREDIT_CARD,
            name: 'CREDIT_CARD',
            curr_id: USD,
            initbalance: '100',
            initlimit: 100,
            icon_id: 1,
        },
        BTC_CREDIT: {
            type: ACCOUNT_TYPE_CREDIT_CARD,
            name: 'BTC_CREDIT',
            curr_id: BTC,
            initbalance: '0.123456',
            initlimit: 0.125,
            icon_id: 3,
        },
    };

    await App.scenario.createMultiple('account', data);
    await App.state.fetch();
};
