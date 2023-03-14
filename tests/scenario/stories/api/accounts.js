import { setBlock } from 'jezve-test';
import { App } from '../../../Application.js';
import { ACCOUNT_HIDDEN } from '../../../model/AccountsList.js';
import * as AccountApiTests from '../../../run/api/account.js';

const create = async () => {
    setBlock('Create accounts', 2);

    const { RUB, USD } = App.scenario;

    const data = [{
        name: 'acc ru',
        curr_id: RUB,
        initbalance: 100,
        icon_id: 1,
        flags: 0,
    }, {
        name: 'cash ru',
        curr_id: RUB,
        initbalance: 5000,
        icon_id: 3,
        flags: 0,
    }, {
        name: 'acc usd',
        curr_id: USD,
        initbalance: 10.5,
        icon_id: 5,
        flags: 0,
    }];

    [
        App.scenario.ACC_RUB,
        App.scenario.CASH_RUB,
        App.scenario.ACC_USD,
    ] = await App.scenario.runner.runGroup(AccountApiTests.create, data);
};

const createWithChainedRequest = async () => {
    setBlock('Create accounts with chained request', 2);

    const { RUB, USD } = App.scenario;

    const data = [{
        name: 'Chained rub',
        curr_id: RUB,
        initbalance: 100,
        icon_id: 0,
        flags: ACCOUNT_HIDDEN,
        returnState: {
            accounts: { visibility: 'visible' },
        },
    }, {
        name: 'Chained usd',
        curr_id: USD,
        initbalance: 50,
        icon_id: 2,
        flags: 0,
        returnState: {
            accounts: { visibility: 'all' },
        },
    }];

    [
        App.scenario.ACC_CHAINED_RUB,
        App.scenario.ACC_CHAINED_USD,
    ] = await App.scenario.runner.runGroup(AccountApiTests.create, data);
};

const createInvalid = async () => {
    setBlock('Create accounts with invalid data', 2);

    const { USD } = App.scenario;

    const data = [{
        // Try to create account with existing name
        name: 'acc ru',
        curr_id: USD,
        initbalance: 10.5,
        icon_id: 0,
        flags: 0,
    }, {
        // Try to create account without some of fields
        curr_id: USD,
        initbalance: 10.5,
        icon_id: 0,
        flags: 0,
    }, {
        name: 'acc tst',
        initbalance: 10.5,
    }, {
        // Try to create account with excess properties
        name: 'acc tst',
        curr_id: USD,
        initbalance: 10.5,
        icon_id: 5,
        flags: 0,
        xxx: 1,
        yyy: 2,
    }, {
        // Try to create account with invalid data
        name: '',
        curr_id: USD,
        initbalance: 10.5,
        icon_id: 5,
        flags: 0,
    }, {
        name: 'acc tst',
        curr_id: 9999,
        initbalance: 10.5,
        icon_id: 5,
        flags: 0,
    }, {
        name: 'acc tst',
        curr_id: USD,
        initbalance: 'fff',
        icon_id: 5,
        flags: 0,
    }];

    await App.scenario.runner.runGroup(AccountApiTests.create, data);
};

const createMultiple = async () => {
    setBlock('Create multiple accounts', 2);

    const { RUB, USD } = App.scenario;

    const data = [{
        name: 'Account 1',
        curr_id: RUB,
        initbalance: 100,
        icon_id: 0,
        flags: 0,
    }, {
        name: 'Account 2',
        curr_id: RUB,
        initbalance: 0,
        icon_id: 4,
        flags: 0,
    }, {
        name: 'Account 3',
        curr_id: USD,
        initbalance: 100,
        icon_id: 5,
        flags: 0,
    }];

    [
        App.scenario.ACCOUNT_1,
        App.scenario.ACCOUNT_2,
        App.scenario.ACCOUNT_3,
    ] = await AccountApiTests.createMultiple(data);
};

const createMultipleInvalid = async () => {
    setBlock('Create multiple accounts with invalid data', 2);

    const { RUB, USD } = App.scenario;

    const data = [
        null,
        [null],
        [null, null],
        [{
            name: '',
            curr_id: USD,
            initbalance: 10.5,
            icon_id: 5,
            flags: 0,
        }, {
            name: 'Account 3',
            curr_id: 999,
            initbalance: 100,
            icon_id: 5,
            flags: 0,
        }],
        [{
            name: 'Account 4',
            curr_id: RUB,
            initbalance: 0,
            icon_id: 4,
            flags: 0,
        }, null],
    ];

    await App.scenario.runner.runGroup(AccountApiTests.createMultiple, data);
};

const update = async () => {
    setBlock('Update accounts', 2);

    const { ACC_RUB, USD } = App.scenario;

    const data = [{
        id: ACC_RUB,
        name: 'acc rub',
        curr_id: USD,
        initbalance: 101,
        icon_id: 2,
    }];

    await App.scenario.runner.runGroup(AccountApiTests.update, data);
};

const updateWithChainedRequest = async () => {
    setBlock('Update accounts with chained request', 2);

    const { ACC_CHAINED_RUB, RUB } = App.scenario;

    const data = [{
        id: ACC_CHAINED_RUB,
        name: 'Acc chain',
        curr_id: RUB,
        initbalance: 101,
        icon_id: 2,
        returnState: {
            accounts: { visibility: 'hidden' },
        },
    }];

    await App.scenario.runner.runGroup(AccountApiTests.update, data);
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
