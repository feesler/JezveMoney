import {
    test,
    assert,
} from 'jezve-test';
import { api } from '../../model/api.js';
import { ApiRequestError } from '../../error/ApiRequestError.js';
import { Transaction } from '../../model/Transaction.js';
import { formatProps } from '../../common.js';
import { App } from '../../Application.js';
import { ScheduledTransaction } from '../../model/ScheduledTransaction.js';

/**
 * Creates scheduled transaction with specified params and check expected state of app
 */
export const create = async (params) => {
    let itemId = 0;

    const typeStr = Transaction.typeToString(params.type);
    const titleParams = structuredClone(params);
    delete titleParams.type;

    await test(`Create scheduled transaction ${typeStr} (${formatProps(titleParams)})`, async () => {
        const resExpected = App.state.createScheduledTransaction(params);
        const reqParams = App.state.prepareChainedRequestData(params);

        let createRes;
        try {
            createRes = await api.schedule.create(reqParams);
            assert.deepMeet(createRes, resExpected);
        } catch (e) {
            if (!(e instanceof ApiRequestError) || resExpected) {
                throw e;
            }
        }

        itemId = (createRes) ? createRes.id : resExpected;

        return App.state.fetchAndTest();
    });

    return itemId;
};

/**
 * Create multiple scheduled transaction with specified params and check expected state of app
 */
export const createMultiple = async (params) => {
    let ids = [];

    await test('Create multiple scheduled transactions', async () => {
        let expectedResult = false;
        if (Array.isArray(params)) {
            expectedResult = { ids: [] };
            const origState = App.state.clone();

            for (const item of params) {
                const resExpected = App.state.createScheduledTransaction(item);
                if (!resExpected) {
                    App.state.setState(origState);
                    expectedResult = false;
                    break;
                }

                expectedResult.ids.push(resExpected.id);
            }
        }

        let createRes;
        try {
            createRes = await api.schedule.createMultiple(params);
            assert.deepMeet(createRes, expectedResult);
        } catch (e) {
            if (!(e instanceof ApiRequestError) || expectedResult) {
                throw e;
            }
        }

        ids = (createRes) ? createRes.ids : expectedResult;

        return App.state.fetchAndTest();
    });

    return ids;
};

export const extractAndCreate = async (data) => {
    const extracted = ScheduledTransaction.extract(data, App.state);

    return create(extracted);
};

export const extractAndCreateMultiple = async (data) => {
    const extracted = Array.isArray(data)
        ? data.map((item) => {
            try {
                return ScheduledTransaction.extract(item, App.state);
            } catch (e) {
                return null;
            }
        })
        : data;

    return createMultiple(extracted);
};

/**
 * Updates scheduled transaction with specified params and check expected state of app
 * @param {Object} params
 */
export const update = async (params) => {
    let updateRes;

    await test(`Update scheduled transaction (${formatProps(params)})`, async () => {
        const resExpected = App.state.updateScheduledTransaction(params);

        const item = App.state.schedule.getItem(params.id);
        const updParams = (item) ? structuredClone(item) : {};
        Object.assign(updParams, params);

        const reqParams = App.state.prepareChainedRequestData(updParams);

        try {
            updateRes = await api.schedule.update(reqParams);
            assert.deepMeet(updateRes, resExpected);
        } catch (e) {
            if (!(e instanceof ApiRequestError) || resExpected) {
                throw e;
            }
        }

        return App.state.fetchAndTest();
    });

    return updateRes;
};

/**
 * Deletes specified transaction(s) and check expected state of app
 * @param {number[]} ids - array of transaction identificators
 */
export const del = async (params) => {
    let deleteRes;

    await test(`Delete scheduled transaction (${formatProps(params)})`, async () => {
        const resExpected = App.state.deleteScheduledTransaction(params);
        const reqParams = App.state.prepareChainedRequestData(params);

        try {
            deleteRes = await api.schedule.del(reqParams);
            assert.deepMeet(deleteRes, resExpected);
        } catch (e) {
            if (!(e instanceof ApiRequestError) || resExpected) {
                throw e;
            }
        }

        return App.state.fetchAndTest();
    });

    return deleteRes;
};

/**
 * Reads scheduled transactions by ids and returns array of results
 * @param {number} id - item id or array of ids
 */
export const read = async (id) => {
    let res = [];

    await test(`Read scheduled transaction(s) [${formatProps(id)}]`, async () => {
        const resExpected = App.state.schedule.getItems(id);

        let createRes;
        try {
            createRes = await api.schedule.read(id);
            assert.deepMeet(createRes, resExpected);
        } catch (e) {
            if (!(e instanceof ApiRequestError) || resExpected) {
                throw e;
            }
        }

        res = createRes ?? resExpected;

        return App.state.fetchAndTest();
    });

    return res;
};

/**
 * Reads list of scheduled transactions
 */
export const list = async (params) => {
    let res = [];

    await test(`Scheduled transactions list (${formatProps(params)})`, async () => {
        const { data: resExpected } = App.state.getScheduledTransactions(params);

        let listRes;
        try {
            listRes = await api.schedule.list(params);
            assert.deepMeet(listRes, resExpected);
        } catch (e) {
            if (!(e instanceof ApiRequestError) || resExpected) {
                throw e;
            }
        }

        res = listRes ?? resExpected;

        return App.state.fetchAndTest();
    });

    return res;
};
