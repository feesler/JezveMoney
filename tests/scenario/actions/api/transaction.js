import {
    test,
    assert,
} from 'jezve-test';
import { api } from '../../../model/api.js';
import { ApiRequestError } from '../../../error/ApiRequestError.js';
import { Transaction } from '../../../model/Transaction.js';
import { formatProps } from '../../../common.js';
import { App } from '../../../Application.js';

/**
 * Create transaction with specified params and check expected state of app
 * @param {Object} params
 * @param {number} params.type - transaction type
 * @param {number} params.src_id - source account
 * @param {number} params.dest_id - destination account
 * @param {number} params.src_curr - source currency
 * @param {number} params.dest_curr - destination currency
 * @param {number} params.src_amount - source amount
 * @param {number} params.dest_amount - destination amount
 * @param {string} params.date - date of transaction
 * @param {string} params.comment - comment
 */
export const create = async (params) => {
    let transactionId = 0;

    const typeStr = Transaction.typeToString(params.type);
    const titleParams = structuredClone(params);
    delete titleParams.type;

    await test(`Create ${typeStr} transaction (${formatProps(titleParams)})`, async () => {
        const resExpected = App.state.createTransaction(params);
        const reqParams = App.state.prepareChainedRequestData(params);

        let createRes;
        try {
            createRes = await api.transaction.create(reqParams);
            assert.deepMeet(createRes, resExpected);
        } catch (e) {
            if (!(e instanceof ApiRequestError) || resExpected) {
                throw e;
            }
        }

        transactionId = (createRes) ? createRes.id : resExpected;

        return App.state.fetchAndTest();
    });

    return transactionId;
};

/**
 * Create multiple transaction with specified params and check expected state of app
 */
export const createMultiple = async (params) => {
    let ids = [];

    await test('Create multiple transactions', async () => {
        const expectedResult = App.state.createMultiple('createTransaction', params);
        const reqParams = App.state.prepareChainedRequestData(params);

        let createRes;
        try {
            createRes = await api.transaction.createMultiple(reqParams);
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
    const extracted = Transaction.extract(data, App.state);

    return create(extracted);
};

export const extractAndCreateMultiple = async (params) => {
    const source = (params?.data) ? params : { data: params };
    const { data, ...rest } = source;

    const extracted = Array.isArray(data)
        ? data.map((item) => {
            try {
                return Transaction.extract(item, App.state);
            } catch (e) {
                return null;
            }
        })
        : data;

    return createMultiple({ data: extracted, ...rest });
};

/**
 * Update transaction with specified params and check expected state of app
 * @param {Object} params
 * @param {number} params.type - transaction type
 * @param {number} params.src_id - source account
 * @param {number} params.dest_id - destination account
 * @param {number} params.src_curr - source currency
 * @param {number} params.dest_curr - destination currency
 * @param {number} params.src_amount - source amount
 * @param {number} params.dest_amount - destination amount
 * @param {string} params.date - date of transaction
 * @param {string} params.comment - comment
 */
export const update = async (params) => {
    let updateRes;

    await test(`Update transaction (${formatProps(params)})`, async () => {
        const resExpected = App.state.updateTransaction(params);

        const expTrans = App.state.transactions.getItem(params.id);
        const updParams = (expTrans)
            ? App.state.transactionToRequest(expTrans)
            : { date: App.datesSec.now, comment: '' };
        Object.assign(updParams, params);

        const reqParams = App.state.prepareChainedRequestData(updParams);

        try {
            updateRes = await api.transaction.update(reqParams);
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
 * Delete specified transaction(s) and check expected state of app
 * @param {number[]} ids - array of transaction identificators
 */
export const del = async (params) => {
    let deleteRes;

    await test(`Delete transaction (${params})`, async () => {
        const resExpected = App.state.deleteTransactions(params);
        const reqParams = App.state.prepareChainedRequestData(params);

        try {
            deleteRes = await api.transaction.del(reqParams);
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

// Set category for specified transactions
export const setCategory = async (params) => {
    let result;

    await test(`Set category of transaction (${formatProps(params)})`, async () => {
        const resExpected = App.state.setTransactionCategory(params);

        let reqParams = structuredClone(params);
        reqParams.category_id = reqParams.category;
        delete reqParams.category;

        reqParams = App.state.prepareChainedRequestData(reqParams);

        try {
            result = await api.transaction.setCategory(reqParams);
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

// Set new position for specified transaction
export const setPos = async (params) => {
    let result;

    await test(`Set position of transaction (${formatProps(params)})`, async () => {
        const resExpected = App.state.setTransactionPos(params);
        const reqParams = App.state.prepareChainedRequestData(params);

        try {
            result = await api.transaction.setPos(reqParams);
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

// Filter list of transaction by specified params
export const filter = async (params) => {
    await test(`Filter transactions (${formatProps(params)})`, async () => {
        const transactions = App.state.transactions.clone();
        let expTransList = transactions.applyFilter(params);
        if ('page' in params || 'range' in params || 'onPage' in params) {
            const targetPage = params.page ?? 1;
            const targetRange = params.range ?? 1;
            expTransList = expTransList.getPage(targetPage, params.onPage, targetRange);
        }
        // Sort again if asc order was requested
        // TODO: think how to avoid automatic sort at TransactionsList.setData()
        const isDesc = params.order?.toLowerCase() === 'desc';
        if (!isDesc) {
            expTransList.data = expTransList.sortAsc();
        }

        // Prepare request parameters
        const reqParams = App.state.getTransactionsListRequest(params);

        // Send API sequest to server
        const trList = await api.transaction.list(reqParams);
        assert(trList, 'Fail to read list of transactions');

        return assert.deepMeet(trList.items, expTransList.data);
    });
};

// Request statistics data
export const statistics = async (params) => {
    await test(`Statistics (${formatProps(params)})`, async () => {
        const stateParams = { ...params };
        if (params.stdate) {
            stateParams.startDate = params.stdate;
        }
        if (params.enddate) {
            stateParams.endDate = params.enddate;
        }
        const histogram = App.state.transactions.getStatistics(stateParams);
        const expected = { histogram };

        // Send API sequest to server
        const data = await api.transaction.statistics(params);
        assert(data, 'Fail to obtain statistics data');

        return assert.deepMeet(data, expected);
    });
};
