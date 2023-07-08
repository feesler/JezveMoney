import { test, assert } from 'jezve-test';
import { api } from '../../../model/api.js';
import { ApiRequestError } from '../../../error/ApiRequestError.js';
import { formatProps } from '../../../common.js';
import { App } from '../../../Application.js';

/**
 * Confirms reminder with specified params and check expected state of app
 * @param {Object} params
 */
export const confirm = async (params) => {
    let result;

    await test(`Confirm reminder (${formatProps(params)})`, async () => {
        const resExpected = App.state.confirmReminder(params);

        try {
            result = await api.reminder.confirm(params);
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
 * Cancels reminder with specified params and check expected state of app
 * @param {Object} params
 */
export const cancel = async (params) => {
    let result;

    await test(`Cancel reminder (${formatProps(params)})`, async () => {
        const resExpected = App.state.cancelReminder(params);

        try {
            result = await api.reminder.cancel(params);
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
 * Reads scheduled transactions by ids and returns array of results
 * @param {number} id - item id or array of ids
 */
export const read = async (id) => {
    let res = [];

    await test(`Read reminder(s) [${formatProps(id)}]`, async () => {
        const resExpected = App.state.reminders.getItems(id);

        let createRes;
        try {
            createRes = await api.reminder.read(id);
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
 * Reads list of reminders
 */
export const list = async (params) => {
    let res = [];

    await test(`Reminder list (${formatProps(params)})`, async () => {
        const { data: resExpected } = App.state.getReminders(params);

        let listRes;
        try {
            listRes = await api.reminder.list(params);
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
 * Reads list of upcoming reminders
 */
export const upcoming = async (params) => {
    let res = [];

    await test(`Upcoming reminders (${formatProps(params)})`, async () => {
        const { data: resExpected } = App.state.getUpcomingReminders(params);

        let listRes;
        try {
            listRes = await api.reminder.upcoming(params);

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
