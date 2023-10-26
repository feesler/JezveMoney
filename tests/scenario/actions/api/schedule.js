import { assert } from '@jezvejs/assert';
import { test } from 'jezve-test';
import { api } from '../../../model/api.js';
import { ApiRequestError } from '../../../error/ApiRequestError.js';
import { formatProps } from '../../../common.js';
import { App } from '../../../Application.js';
import { ScheduledTransaction } from '../../../model/ScheduledTransaction.js';

/**
 * Creates scheduled transaction with specified params and check expected state of app
 */
export const create = async (params) => {
    let result = 0;
    const isMultiple = params?.data?.length > 1;
    const descr = (isMultiple)
        ? 'Create multiple scheduled transactions'
        : `Create scheduled transaction (${formatProps(params)})`;

    await test(descr, async () => {
        const resExpected = (isMultiple)
            ? App.state.createMultiple('createScheduledTransaction', params)
            : App.state.createScheduledTransaction(params);

        let createRes;
        try {
            createRes = await api.schedule.create(params);
            assert.deepMeet(createRes, resExpected);
        } catch (e) {
            if (!(e instanceof ApiRequestError) || resExpected) {
                throw e;
            }
        }

        if (createRes) {
            result = (isMultiple) ? createRes.ids : createRes.id;
        } else {
            result = resExpected;
        }

        return App.state.fetchAndTest();
    });

    return result;
};

export const extractAndCreate = async (data) => {
    const extracted = ScheduledTransaction.extract(data, App.state);

    return create(extracted);
};

export const extractAndCreateMultiple = async (params) => {
    const source = (params?.data) ? params : { data: params };
    const { data, ...rest } = source;

    const extracted = Array.isArray(data)
        ? data.map((item) => {
            try {
                return ScheduledTransaction.extract(item, App.state);
            } catch (e) {
                return null;
            }
        })
        : data;

    return create({ data: extracted, ...rest });
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

        try {
            updateRes = await api.schedule.update(updParams);
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
 * Finished specified transaction(s) and check expected state of app
 * @param {number[]} ids - array of transaction identificators
 */
export const finish = async (params) => {
    let result;

    await test(`Finish scheduled transaction (${formatProps(params)})`, async () => {
        const resExpected = App.state.finishScheduledTransaction(params);

        try {
            result = await api.schedule.finish(params);
            assert.deepMeet(result, resExpected);
        } catch (e) {
            if (!(e instanceof ApiRequestError) || resExpected) {
                throw e;
            }
        }

        return App.state.fetchAndTest();
    });

    return result;
};

/**
 * Deletes specified transaction(s) and check expected state of app
 * @param {number[]} ids - array of transaction identificators
 */
export const del = async (params) => {
    let deleteRes;

    await test(`Delete scheduled transaction (${formatProps(params)})`, async () => {
        const resExpected = App.state.deleteScheduledTransaction(params);

        try {
            deleteRes = await api.schedule.del(params);
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
