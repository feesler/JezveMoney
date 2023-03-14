import {
    test,
    copyObject,
    assert,
    asArray,
} from 'jezve-test';
import { api } from '../../model/api.js';
import { ApiRequestError } from '../../error/ApiRequestError.js';
import { formatProps } from '../../common.js';
import { App } from '../../Application.js';

/**
 * Create person with specified params and check expected state of app
 * @param {Object} params
 * @param {string} params.name - name of person
 */
export const create = async (params) => {
    let personId = 0;

    await test(`Create person (${formatProps(params)})`, async () => {
        let createRes = null;
        const resExpected = App.state.createPerson(params);
        const reqParams = App.state.prepareChainedRequestData(params);

        try {
            createRes = await api.person.create(reqParams);
            assert.deepMeet(createRes, resExpected);
        } catch (e) {
            if (!(e instanceof ApiRequestError) || resExpected) {
                throw e;
            }
        }

        personId = (createRes) ? createRes.id : resExpected;

        return App.state.fetchAndTest();
    });

    return personId;
};

/**
 * Create multiple persons with specified params and check expected state of app
 */
export const createMultiple = async (params) => {
    let ids = [];

    await test('Create multiple persons', async () => {
        let expectedResult = false;
        if (Array.isArray(params)) {
            expectedResult = { ids: [] };
            for (const item of params) {
                const resExpected = App.state.createPerson(item);
                if (!resExpected) {
                    App.state.deletePersons({ id: expectedResult.ids });
                    expectedResult = false;
                    break;
                }

                expectedResult.ids.push(resExpected.id);
            }
        }

        let createRes;
        try {
            createRes = await api.person.createMultiple(params);
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
 * Reads persons by ids and returns array of results
 * @param {number} id - person id or array of ids
 */
export const read = async (id) => {
    let res = [];

    const ids = asArray(id)
        .filter((item) => !!item)
        .map((item) => item.toString());

    await test(`Read person(s) [${ids}]`, async () => {
        const resExpected = App.state.persons.filter((item) => (
            ids.includes(item?.id?.toString())
        ));

        let createRes;
        try {
            createRes = await api.person.read(id);
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
 * Reads list of persons
 * @param {Object} params - list filter object
 */
export const list = async (params) => {
    let res = [];

    await test(`Persons list (${formatProps(params)})`, async () => {
        const { data: resExpected } = App.state.getPersons(params);

        let listRes;
        try {
            listRes = await api.person.list(params);
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
 * Update person with specified params and check expected state of app
 * @param {Object} params
 * @param {string} params.id - person identifier
 * @param {string} params.name - name of person
 */
export const update = async (params) => {
    let updateRes = false;

    await test(`Update person (${formatProps(params)})`, async () => {
        const resExpected = App.state.updatePerson(params);

        const item = App.state.persons.getItem(params.id);
        const updParams = (item) ? copyObject(item) : {};
        Object.assign(updParams, params);

        const reqParams = App.state.prepareChainedRequestData(updParams);

        try {
            updateRes = await api.person.update(reqParams);
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
 * Delete specified person(s) and check expected state of app
 * @param {number[]} ids - array of person identificators
 */
export const del = async (params) => {
    let deleteRes = false;

    await test(`Delete person (${params})`, async () => {
        const resExpected = App.state.deletePersons(params);
        const reqParams = App.state.prepareChainedRequestData(params);

        try {
            deleteRes = await api.person.del(reqParams);
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

/** Set new position for specified person */
export const setPos = async (params) => {
    let result;

    await test(`Set position of person (${formatProps(params)})`, async () => {
        const resExpected = App.state.setPersonPos(params);
        const reqParams = App.state.prepareChainedRequestData(params);

        try {
            result = await api.person.setPos(reqParams);
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
