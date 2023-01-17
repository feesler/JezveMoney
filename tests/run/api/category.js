import { test, copyObject } from 'jezve-test';
import { api } from '../../model/api.js';
import { ApiRequestError } from '../../error/ApiRequestError.js';
import { formatProps } from '../../common.js';
import { App } from '../../Application.js';

/**
 * Create category with specified params and check expected state of app
 * @param {Object} params
 * @param {string} params.name - name of category
 * @param {number} params.parent_id - parent category
 * @param {number} params.type - transaction type
 */
export const create = async (params) => {
    let itemId = 0;

    await test(`Create category (${formatProps(params)})`, async () => {
        const resExpected = App.state.createCategory(params);

        let createRes;
        try {
            createRes = await api.category.create(params);
            if (resExpected && (!createRes || !createRes.id)) {
                return false;
            }
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
 * Create multiple categories with specified params and check expected state of app
 */
export const createMultiple = async (params) => {
    let ids = [];

    await test('Create multiple categories', async () => {
        let expectedResult = false;
        if (Array.isArray(params)) {
            expectedResult = [];
            for (const item of params) {
                const resExpected = App.state.createCategory(item);
                if (!resExpected) {
                    App.state.deleteCategories(expectedResult);
                    expectedResult = false;
                    break;
                }

                expectedResult.push(resExpected);
            }
        }

        // Send API sequest to server
        let createRes;
        try {
            createRes = await api.category.createMultiple(params);
            if (expectedResult && (!createRes || !createRes.ids)) {
                return false;
            }
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

/**
 * Update category with specified params and check expected state of app
 * @param {Object} params
 * @param {string} params.id - identifier of category
 * @param {string} params.name - name of category
 * @param {number} params.parent_id - parent category
 * @param {number} params.type - transaction type
 */
export const update = async (params) => {
    let updateRes = false;
    const props = copyObject(params);

    await test(`Update category (${formatProps(props)})`, async () => {
        const resExpected = App.state.updateCategory(props);
        let updParams = {};

        const item = App.state.categories.getItem(props.id);
        if (item) {
            updParams = copyObject(item);
        }

        if (!resExpected) {
            Object.assign(updParams, props);
        }

        // Send API sequest to server
        try {
            updateRes = await api.category.update(updParams);
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
};

/**
 * Delete specified categories and check expected state of app
 * @param {number[]} ids - array of category identificators
 */
export const del = async (ids, removeChildren = true) => {
    let deleteRes = false;

    await test(`Delete categories (${ids})`, async () => {
        const resExpected = App.state.deleteCategories(ids, removeChildren);

        // Send API sequest to server
        try {
            deleteRes = await api.category.del(ids, removeChildren);
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
};
