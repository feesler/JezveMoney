import { setBlock } from 'jezve-test';
import { App } from '../../../Application.js';
import * as Actions from '../../actions/api/userCurrencies.js';

const create = async () => {
    setBlock('Create user currencies', 2);

    const data = {
        USER_CURR_RUB: {
            curr_id: App.scenario.RUB,
        },
        USER_CURR_USD: {
            curr_id: App.scenario.USD,
        },
    };

    await App.scenario.createOneByOne(Actions.create, data);
};

const createWithChainedRequest = async () => {
    setBlock('Create user currencies with chained request', 2);

    const data = {
        USER_CURR_EUR: {
            curr_id: App.scenario.EUR,
            returnState: {
                userCurrencies: {},
            },
        },
    };

    await App.scenario.createOneByOne(Actions.create, data);
};

const createInvalid = async () => {
    setBlock('Create user currencies with invalid data', 2);

    const data = [{
        // Try to create entry for already existing currency
        curr_id: App.scenario.EUR,
    }, {
        // Invalid data tests
    }, {
        curr_id: 0,
    }];

    await App.scenario.runner.runGroup(Actions.create, data);
};

const createMultiple = async () => {
    setBlock('Create multiple user currencies', 2);

    const data = {
        USER_CURR_PLN: {
            curr_id: App.scenario.PLN,
        },
        USER_CURR_KRW: {
            curr_id: App.scenario.KRW,
        },
    };

    await App.scenario.createMultiple(Actions, data);
};

const createMultipleInvalid = async () => {
    setBlock('Create multiple user currencies with invalid data', 2);

    const data = [
        null,
        [null],
        [null, null],
        [{
            curr_id: 0,
        }, {
            curr_id: App.scenario.EUR,
        }, null],
    ];

    await App.scenario.runner.runGroup(Actions.createMultiple, data);
};

const read = async () => {
    setBlock('Read user currencies by ids', 2);

    const data = [
        App.scenario.USER_CURR_RUB,
        [App.scenario.USER_CURR_USD, App.scenario.USER_CURR_EUR],
    ];

    await App.scenario.runner.runGroup(Actions.read, data);
};

const list = async () => {
    setBlock('User currency list', 2);

    const data = [
        {},
    ];

    await App.scenario.runner.runGroup(Actions.list, data);
};

const update = async () => {
    setBlock('Update user currency', 2);

    const CNY = 10;

    const data = [
        { id: App.scenario.USER_CURR_RUB, curr_id: CNY },
    ];

    return App.scenario.runner.runGroup(Actions.update, data);
};

const updateWithChainedRequest = async () => {
    setBlock('Update user currencies with chained request', 2);

    const data = [
        {
            id: App.scenario.USER_CURR_RUB,
            curr_id: App.scenario.RUB,
            returnState: {
                userCurrencies: {},
            },
        },
    ];

    return App.scenario.runner.runGroup(Actions.update, data);
};

const updateInvalid = async () => {
    setBlock('Update user currencies with invalid data', 2);

    const data = [
        // Try to update currency to an existing one
        { id: App.scenario.USER_CURR_RUB, curr_id: App.scenario.USD },
        // Try to update currency with invalid value
        { id: App.scenario.USER_CURR_RUB, curr_id: 0 },
    ];

    return App.scenario.runner.runGroup(Actions.update, data);
};

const setPos = async () => {
    setBlock('Set position', 2);

    const { USER_CURR_RUB, USER_CURR_USD } = App.scenario;

    const data = [
        { id: USER_CURR_RUB, pos: 5 },
        { id: USER_CURR_USD, pos: 6 },
    ];

    await App.scenario.runner.runGroup(Actions.setPos, data);
};

const setPosWithChainedRequest = async () => {
    setBlock('Set position with chained request', 2);

    const { USER_CURR_USD } = App.scenario;

    const data = [
        {
            id: USER_CURR_USD,
            pos: 15,
            returnState: {
                userCurrencies: {},
            },
        },
    ];

    await App.scenario.runner.runGroup(Actions.setPos, data);
};

const setPosInvalid = async () => {
    setBlock('Set position with invalid data', 2);

    const { USER_CURR_USD } = App.scenario;

    const data = [
        { id: 0, pos: 5 },
        { id: USER_CURR_USD, pos: 0 },
        { id: USER_CURR_USD },
        { pos: 1 },
        {},
        null,
    ];

    await App.scenario.runner.runGroup(Actions.setPos, data);
};

const del = async () => {
    setBlock('Delete user currencies', 2);

    const data = [
        { id: App.scenario.USER_CURR_USD },
    ];

    return App.scenario.runner.runGroup(Actions.del, data);
};

const delWithChainedRequest = async () => {
    setBlock('Delete user currencies with chained request', 2);

    const { USER_CURR_PLN, USER_CURR_KRW } = App.scenario;

    const data = [
        {
            id: [USER_CURR_PLN, USER_CURR_KRW],
            returnState: {
                userCurrencies: {},
                accounts: { visibility: 'all' },
            },
        },
    ];

    return App.scenario.runner.runGroup(Actions.del, data);
};

const delInvalid = async () => {
    setBlock('Delete user currencies with invalid data', 2);

    const data = [
        null,
        [],
        [null, null],
    ];

    return App.scenario.runner.runGroup(Actions.del, data);
};

export const apiUserCurrenciesTests = {
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
