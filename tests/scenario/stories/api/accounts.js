import { assert, setBlock } from 'jezve-test';
import { App } from '../../../Application.js';
import {
    ACCOUNT_HIDDEN,
    ACCOUNT_TYPE_OTHER,
    ACCOUNT_TYPE_CASH,
    ACCOUNT_TYPE_DEBIT_CARD,
    ACCOUNT_TYPE_CREDIT_CARD,
    ACCOUNT_TYPE_CREDIT,
} from '../../../model/AccountsList.js';
import * as AccountApiTests from '../../../actions/api/account.js';

const create = async () => {
    setBlock('Create accounts', 2);

    const { RUB, USD } = App.scenario;

    const data = [{
        type: ACCOUNT_TYPE_DEBIT_CARD,
        name: 'acc ru',
        curr_id: RUB,
        initbalance: 100,
        icon_id: 1,
    }, {
        type: ACCOUNT_TYPE_CASH,
        name: 'cash ru',
        curr_id: RUB,
        initbalance: 5000,
        icon_id: 3,
    }, {
        type: ACCOUNT_TYPE_DEBIT_CARD,
        name: 'acc usd',
        curr_id: USD,
        initbalance: 10.5,
        icon_id: 5,
    }];

    const res = await App.scenario.runner.runGroup(AccountApiTests.create, data);
    // Double check all accounts are created
    res.forEach((item) => assert(item, 'Failed to create account'));

    [
        App.scenario.ACC_RUB,
        App.scenario.CASH_RUB,
        App.scenario.ACC_USD,
    ] = res;
};

const createWithChainedRequest = async () => {
    setBlock('Create accounts with chained request', 2);

    const { RUB, USD } = App.scenario;

    const data = [{
        type: ACCOUNT_TYPE_OTHER,
        name: 'Chained rub',
        curr_id: RUB,
        initbalance: 100,
        flags: ACCOUNT_HIDDEN,
        returnState: {
            accounts: { visibility: 'visible' },
        },
    }, {
        type: ACCOUNT_TYPE_OTHER,
        name: 'Chained usd',
        curr_id: USD,
        initbalance: 50,
        icon_id: 2,
        returnState: {
            accounts: { visibility: 'all' },
        },
    }];

    const res = await App.scenario.runner.runGroup(AccountApiTests.create, data);
    // Double check all accounts are created
    res.forEach((item) => assert(item, 'Failed to create account'));

    [
        App.scenario.ACC_CHAINED_RUB,
        App.scenario.ACC_CHAINED_USD,
    ] = res;
};

const createInvalid = async () => {
    setBlock('Create accounts with invalid data', 2);

    const { USD } = App.scenario;

    const data = [{
        // Existing name
        name: 'acc ru',
        curr_id: USD,
        initbalance: 10.5,
    }, {
        // No name
        type: ACCOUNT_TYPE_OTHER,
        curr_id: USD,
        initbalance: 10.5,
    }, {
        // No currency
        name: 'acc tst',
        initbalance: 10.5,
    }, {
        // Excess properties
        type: ACCOUNT_TYPE_OTHER,
        name: 'acc tst',
        curr_id: USD,
        initbalance: 10.5,
        icon_id: 5,
        xxx: 1,
        yyy: 2,
    }, {
        // Empty name
        type: ACCOUNT_TYPE_OTHER,
        name: '',
        curr_id: USD,
        initbalance: 10.5,
        icon_id: 5,
    }, {
        // Invalid currency
        type: ACCOUNT_TYPE_OTHER,
        name: 'acc tst',
        curr_id: 9999,
        initbalance: 10.5,
        icon_id: 5,
    }, {
        // Invalid balance
        type: ACCOUNT_TYPE_OTHER,
        name: 'acc tst',
        curr_id: USD,
        initbalance: 'fff',
        icon_id: 5,
    }, {
        // Invalid type
        type: -1,
        name: 'acc tst',
        curr_id: USD,
        initbalance: 'fff',
        icon_id: 5,
    }];

    await App.scenario.runner.runGroup(AccountApiTests.create, data);
};

const createMultiple = async () => {
    setBlock('Create multiple accounts', 2);

    const { RUB, USD, BTC } = App.scenario;

    const data = [{
        type: ACCOUNT_TYPE_CASH,
        name: 'Account 1',
        curr_id: RUB,
        initbalance: 100,
    }, {
        type: ACCOUNT_TYPE_DEBIT_CARD,
        name: 'Account 2',
        curr_id: RUB,
        initbalance: 0,
        icon_id: 4,
    }, {
        type: ACCOUNT_TYPE_CREDIT_CARD,
        name: 'Account 3',
        curr_id: USD,
        initbalance: 100,
        initlimit: 100,
        icon_id: 5,
    }, {
        type: ACCOUNT_TYPE_CREDIT_CARD,
        name: 'BTC_CREDIT',
        curr_id: BTC,
        initbalance: 0.123456,
        initlimit: 0.125,
        icon_id: 3,
    }];

    const res = await AccountApiTests.createMultiple(data);
    // Double check all accounts are created
    res.forEach((item) => assert(item, 'Failed to create account'));

    [
        App.scenario.ACCOUNT_1,
        App.scenario.ACCOUNT_2,
        App.scenario.ACCOUNT_3,
        App.scenario.BTC_CREDIT,
    ] = res;
};

const createMultipleInvalid = async () => {
    setBlock('Create multiple accounts with invalid data', 2);

    const { RUB, USD } = App.scenario;

    const data = [
        null,
        [null],
        [null, null],
        [{
            // Empty name
            type: ACCOUNT_TYPE_OTHER,
            name: '',
            curr_id: USD,
            initbalance: 10.5,
            icon_id: 5,
        }, {
            // Invalid currency
            type: ACCOUNT_TYPE_OTHER,
            name: 'Account 3',
            curr_id: 999,
            initbalance: 100,
            icon_id: 5,
        }],
        // Valid and invalid items in array
        [{
            type: ACCOUNT_TYPE_CASH,
            name: 'Account 4',
            curr_id: RUB,
            initbalance: 0,
            icon_id: 4,
        }, null],
    ];

    await App.scenario.runner.runGroup(AccountApiTests.createMultiple, data);
};

const read = async () => {
    setBlock('Read accounts by ids', 2);

    const data = [
        App.scenario.ACC_RUB,
        [App.scenario.CASH_RUB, App.scenario.ACC_USD],
    ];

    await App.scenario.runner.runGroup(AccountApiTests.read, data);
};

const list = async () => {
    setBlock('Accounts list', 2);

    const data = [
        {},
        { visibility: 'visible' },
        { visibility: 'hidden' },
        { visibility: 'all' },
    ];

    await App.scenario.runner.runGroup(AccountApiTests.list, data);
};

const update = async () => {
    setBlock('Update accounts', 2);

    const { ACC_RUB, BTC_CREDIT, USD } = App.scenario;

    const data = [{
        id: ACC_RUB,
        name: 'acc rub',
        curr_id: USD,
        initbalance: 101,
        icon_id: 2,
    }, {
        id: BTC_CREDIT,
        type: ACCOUNT_TYPE_CREDIT,
    }];

    const res = await App.scenario.runner.runGroup(AccountApiTests.update, data);
    // Double check all accounts are updated
    res.forEach((item) => assert(item, 'Failed to update account'));
};

const updateWithChainedRequest = async () => {
    setBlock('Update accounts with chained request', 2);

    const { ACC_CHAINED_RUB, RUB } = App.scenario;

    const data = [{
        id: ACC_CHAINED_RUB,
        type: ACCOUNT_TYPE_CREDIT,
        name: 'Acc chain',
        curr_id: RUB,
        initbalance: 101,
        icon_id: 2,
        returnState: {
            accounts: { visibility: 'hidden' },
        },
    }];

    const res = await App.scenario.runner.runGroup(AccountApiTests.update, data);
    // Double check all accounts are created
    res.forEach((item) => assert(item, 'Failed to create account'));
};

const updateInvalid = async () => {
    setBlock('Update accounts with invalid data', 2);

    const data = [{
        // Try to update name of account to an existing one
        id: App.scenario.CASH_RUB,
        name: 'acc rub',
    }];

    await App.scenario.runner.runGroup(AccountApiTests.update, data);
};

const setPos = async () => {
    setBlock('Set position', 2);

    const { ACC_RUB, CASH_RUB } = App.scenario;

    const data = [
        { id: ACC_RUB, pos: 5 },
        { id: CASH_RUB, pos: 10 },
        { id: ACC_RUB, pos: 1 },
    ];

    await App.scenario.runner.runGroup(AccountApiTests.setPos, data);
};

const setPosWithChainedRequest = async () => {
    setBlock('Set position with chained request', 2);

    const { ACC_CHAINED_RUB } = App.scenario;

    const data = [
        {
            id: ACC_CHAINED_RUB,
            pos: 3,
            returnState: {
                accounts: { visibility: 'all' },
            },
        },
    ];

    await App.scenario.runner.runGroup(AccountApiTests.setPos, data);
};

const setPosInvalid = async () => {
    setBlock('Set position with invalid data', 2);

    const { CASH_RUB } = App.scenario;

    const data = [
        { id: 0, pos: 5 },
        { id: CASH_RUB, pos: 0 },
        { id: CASH_RUB },
        { pos: 1 },
        {},
        null,
    ];

    await App.scenario.runner.runGroup(AccountApiTests.setPos, data);
};

const del = async () => {
    setBlock('Delete accounts', 2);

    const data = [{
        id: [App.scenario.ACC_USD, App.scenario.CASH_RUB],
    }];

    await App.scenario.runner.runGroup(AccountApiTests.del, data);
};

const delWithChainedRequest = async () => {
    setBlock('Delete accounts with chained request', 2);

    const data = [{
        id: [App.scenario.ACC_CHAINED_RUB, App.scenario.CASH_RUB],
        returnState: {
            accounts: { visibility: 'all' },
            persons: { visibility: 'all' },
        },
    }];

    await App.scenario.runner.runGroup(AccountApiTests.del, data);
};

const delInvalid = async () => {
    setBlock('Delete accounts with invalid data', 2);

    const data = [
        null,
        [],
        [null, null],
    ];

    await App.scenario.runner.runGroup(AccountApiTests.del, data);
};

export const apiAccountsTests = {
    async createTests() {
        await create();
        await createWithChainedRequest();
        await createInvalid();
        await createMultiple();
        await createMultipleInvalid();
    },

    async listTests() {
        await read();
        await list();
    },

    async updateAndDeleteTests() {
        await update();
        await updateWithChainedRequest();
        await updateInvalid();
        await setPos();
        await setPosWithChainedRequest();
        await setPosInvalid();
        await del();
        await delWithChainedRequest();
        await delInvalid();
    },
};
