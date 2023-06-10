import {
    test,
    assert,
    asArray,
} from 'jezve-test';
import { api } from '../../../model/api.js';
import { ApiRequestError } from '../../../error/ApiRequestError.js';
import { formatProps } from '../../../common.js';
import { App } from '../../../Application.js';

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
        const reqParams = App.state.prepareChainedRequestData(params);

        let createRes;
        try {
            createRes = await api.category.create(reqParams);
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
 * Create multiple categories with specified params and check expected state of app
 */
export const createMultiple = async (params) => {
    let ids = [];

    await test('Create multiple categories', async () => {
        let expectedResult = false;
        if (Array.isArray(params)) {
            expectedResult = { ids: [] };
            for (const item of params) {
                const resExpected = App.state.createCategory(item);
                if (!resExpected) {
                    App.state.deleteCategories({ id: expectedResult.ids });
                    expectedResult = false;
                    break;
                }

                expectedResult.ids.push(resExpected.id);
            }
        }

        const request = { data: params };
        let createRes;
        try {
            createRes = await api.category.createMultiple(request);
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

/**
 * Reads categories by ids and returns array of results
 * @param {number} id - category id or array of ids
 */
export const read = async (id) => {
    let res = [];

    const ids = asArray(id)
        .filter((item) => !!item)
        .map((item) => item.toString());

    await test(`Read categories [${ids}]`, async () => {
        const resExpected = App.state.categories.filter((item) => (
            ids.includes(item?.id?.toString())
        ));

        let createRes;
        try {
            createRes = await api.category.read(id);
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
 * Reads list of categories
 * @param {Object} params - list filter object
 */
export const list = async (params) => {
    let res = [];

    await test(`Categories list (${formatProps(params)})`, async () => {
        const { data: resExpected } = App.state.getCategories(params);

        let listRes;
        try {
            listRes = await api.category.list(params);
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
    const props = structuredClone(params);

    await test(`Update category (${formatProps(props)})`, async () => {
        const resExpected = App.state.updateCategory(props);

        const item = App.state.categories.getItem(props.id);
        const updParams = (item) ? structuredClone(item) : {};
        Object.assign(updParams, props);

        const reqParams = App.state.prepareChainedRequestData(updParams);

        try {
            updateRes = await api.category.update(reqParams);
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
 * Delete specified categories and check expected state of app
 * @param {object} params - delete categories request object
 */
export const del = async (params) => {
    let deleteRes = false;

    await test(`Delete categories (${params})`, async () => {
        const resExpected = App.state.deleteCategories(params);
        const reqParams = App.state.prepareChainedRequestData(params);

        try {
            deleteRes = await api.category.del(reqParams);
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

/** Set new position for specified category */
export const setPos = async (params) => {
    let result;

    await test(`Set position of category (${formatProps(params)})`, async () => {
        const resExpected = App.state.setCategoryPos(params);
        const reqParams = App.state.prepareChainedRequestData(params);

        try {
            result = await api.category.setPos(reqParams);
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
