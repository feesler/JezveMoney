import {
    test,
    formatDate,
    copyObject,
    checkObjValue,
} from 'jezve-test';
import { api } from '../../model/api.js';
import { ApiRequestError } from '../../error/ApiRequestError.js';
import { Transaction } from '../../model/Transaction.js';
import { fixDate, formatProps } from '../../common.js';
import { App } from '../../Application.js';

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
export async function create(params) {
    let transactionId = 0;

    const titleParams = copyObject(params);
    delete titleParams.type;

    await test(`Create ${Transaction.typeToString(params.type)} transaction (${formatProps(titleParams)})`, async () => {
        const resExpected = App.state.createTransaction(params);

        // Send API sequest to server
        let createRes;
        try {
            createRes = await api.transaction.create(params);
            if (resExpected && (!createRes || !createRes.id)) {
                return false;
            }
        } catch (e) {
            if (!(e instanceof ApiRequestError) || resExpected) {
                throw e;
            }
        }

        transactionId = (createRes) ? createRes.id : resExpected;

        return App.state.fetchAndTest();
    });

    return transactionId;
}

export async function extractAndCreate(data) {
    const extracted = Transaction.extract(data, App.state);

    return create(extracted);
}

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
export async function update(params) {
    let updateRes;

    await test(`Update transaction (${formatProps(params)})`, async () => {
        const resExpected = App.state.updateTransaction(params);

        // Obtain data for API request
        let updParams = { date: App.dates.now, comment: '' };
        const expTrans = App.state.transactions.getItem(params.id);

        if (expTrans) {
            updParams = App.state.transactionToRequest(expTrans);
        }
        if (!resExpected) {
            Object.assign(updParams, params);
        }

        // Send API sequest to server
        try {
            updateRes = await api.transaction.update(updParams);
            if (resExpected !== updateRes) {
                return false;
            }
        } catch (e) {
            if (!(e instanceof ApiRequestError) || resExpected) {
                throw e;
            }
        }

        return App.state.fetchAndTest();
    });

    return updateRes;
}

/**
 * Delete specified transaction(s) and check expected state of app
 * @param {number[]} ids - array of transaction identificators
 */
export async function del(ids) {
    let deleteRes;

    await test(`Delete transaction (${ids})`, async () => {
        const resExpected = App.state.deleteTransactions(ids);

        // Send API sequest to server
        try {
            deleteRes = await api.transaction.del(ids);
            if (resExpected !== deleteRes) {
                return false;
            }
        } catch (e) {
            if (!(e instanceof ApiRequestError) || resExpected) {
                throw e;
            }
        }

        return App.state.fetchAndTest();
    });

    return deleteRes;
}

// Set new position for specified transaction
export async function setPos(params) {
    let result;

    await test(`Set position of transaction (${formatProps(params)})`, async () => {
        const resExpected = App.state.setTransactionPos(params);

        // Send API sequest to server
        try {
            result = await api.transaction.setPos(params);
            if (resExpected !== result) {
                return false;
            }
        } catch (e) {
            if (!(e instanceof ApiRequestError) || resExpected) {
                throw e;
            }
        }

        return App.state.fetchAndTest();
    });

    return result;
}

// Filter list of transaction by specified params
export async function filter(params) {
    await test(`Filter transactions (${formatProps(params)})`, async () => {
        const transactions = App.state.transactions.clone();
        let expTransList = transactions.applyFilter(params);
        if ('page' in params || 'onPage' in params) {
            const targetPage = ('page' in params) ? params.page : 1;
            expTransList = expTransList.getPage(targetPage, params.onPage);
        }

        // Prepare request parameters
        const reqParams = {};

        if ('order' in params) {
            reqParams.order = params.order;
        }
        if ('type' in params) {
            reqParams.type = params.type;
        }
        if ('accounts' in params) {
            reqParams.acc_id = params.accounts;
        }
        if ('startDate' in params && 'endDate' in params) {
            reqParams.stdate = formatDate(new Date(fixDate(params.startDate)));
            reqParams.enddate = formatDate(new Date(fixDate(params.endDate)));
        }
        if ('search' in params) {
            reqParams.search = params.search;
        }
        if ('onPage' in params) {
            reqParams.count = params.onPage;
        }
        if ('page' in params) {
            reqParams.page = params.page;
        }

        // Send API sequest to server
        const trList = await api.transaction.list(reqParams);
        if (!trList) {
            throw new Error('Fail to read list of transactions');
        }

        return checkObjValue(trList, expTransList.data);
    });
}
