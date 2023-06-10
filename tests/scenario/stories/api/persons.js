import { setBlock } from 'jezve-test';
import { App } from '../../../Application.js';
import * as Actions from '../../actions/api/person.js';

const create = async () => {
    setBlock('Create persons', 2);

    const data = {
        PERSON_X: {
            name: 'Person X',
        },
        PERSON_Y: {
            name: 'Y',
        },
    };

    await App.scenario.createOneByOne(Actions.create, data);
};

const createWithChainedRequest = async () => {
    setBlock('Create persons with chained request', 2);

    const data = {
        PERSON_CHAINED_Z: {
            name: 'Person Z',
            returnState: {
                persons: { visibility: 'visible' },
            },
        },
        PERSON_CHAINED_AA: {
            name: 'AA',
            returnState: {
                persons: { visibility: 'all' },
                accounts: { visibility: 'all' },
            },
        },
    };

    await App.scenario.createOneByOne(Actions.create, data);
};

const createInvalid = async () => {
    setBlock('Create persons with invalid data', 2);

    const data = [{
        // Try to create person with existing name
        name: 'Y',
    }, {
        // Invalid data tests
    }, {
        name: '',
        flags: 1,
        xxx: 1,
    }, {
        name: '',
        flags: 1,
    }];

    await App.scenario.runner.runGroup(Actions.create, data);
};

const createMultiple = async () => {
    setBlock('Create multiple persons', 2);

    const data = {
        PERSON_1: {
            name: 'Person 1',
        },
        PERSON_2: {
            name: 'Person 2',
        },
        PERSON_3: {
            name: 'Person 3',
        },
    };

    await App.scenario.createMultiple(Actions, data);
};

const createMultipleWithChainedRequest = async () => {
    setBlock('Create multiple persons with chained request', 2);

    const data = {
        data: {
            PERSON_MULTI_CHAINED_1: {
                name: 'Person multi chained 1',
            },
            PERSON_MULTI_CHAINED_2: {
                name: 'Person multi chained 2',
            },
        },
        returnState: {
            persons: { visibility: 'all' },
        },
    };

    await App.scenario.createMultiple(Actions, data);
};

const createMultipleInvalid = async () => {
    setBlock('Create multiple persons with invalid data', 2);

    const data = [
        null,
        {},
        { data: null },
        { data: [null] },
        { data: [null, null] },
        {
            data: [{
                name: '',
            }, {
                name: 'Person 2',
            }],
        },
        {
            data: [{
                name: 'Person 4',
            }, null],
        },
    ];

    await App.scenario.runner.runGroup(Actions.create, data);
};

const read = async () => {
    setBlock('Read persons by ids', 2);

    const data = [
        App.scenario.PERSON_X,
        [App.scenario.PERSON_X, App.scenario.PERSON_Y],
    ];

    await App.scenario.runner.runGroup(Actions.read, data);
};

const list = async () => {
    setBlock('Persons list', 2);

    const data = [
        {},
        { visibility: 'visible' },
        { visibility: 'hidden' },
        { visibility: 'all' },
    ];

    await App.scenario.runner.runGroup(Actions.list, data);
};

const update = async () => {
    setBlock('Update persons', 2);

    const data = [
        { id: App.scenario.PERSON_X, name: 'XX!' },
    ];

    return App.scenario.runner.runGroup(Actions.update, data);
};

const updateWithChainedRequest = async () => {
    setBlock('Update persons with chained request', 2);

    const data = [
        {
            id: App.scenario.PERSON_CHAINED_Z,
            name: 'Zzz',
            returnState: {
                persons: { visibility: 'hidden' },
            },
        },
    ];

    return App.scenario.runner.runGroup(Actions.update, data);
};

const updateInvalid = async () => {
    setBlock('Update persons with invalid data', 2);

    const data = [
        // Try to update name of person to an existing one
        { id: App.scenario.PERSON_X, name: 'XX!' },
        { id: App.scenario.PERSON_X, name: '' },
    ];

    return App.scenario.runner.runGroup(Actions.update, data);
};

const setPos = async () => {
    setBlock('Set position', 2);

    const { PERSON_X, PERSON_Y } = App.scenario;

    const data = [
        { id: PERSON_X, pos: 5 },
        { id: PERSON_Y, pos: 10 },
        { id: PERSON_X, pos: 1 },
    ];

    await App.scenario.runner.runGroup(Actions.setPos, data);
};

const setPosWithChainedRequest = async () => {
    setBlock('Set position with chained request', 2);

    const { PERSON_CHAINED_AA } = App.scenario;

    const data = [
        {
            id: PERSON_CHAINED_AA,
            pos: 15,
            returnState: {
                persons: { visibility: 'all' },
            },
        },
    ];

    await App.scenario.runner.runGroup(Actions.setPos, data);
};

const setPosInvalid = async () => {
    setBlock('Set position with invalid data', 2);

    const { PERSON_X } = App.scenario;

    const data = [
        { id: 0, pos: 5 },
        { id: PERSON_X, pos: 0 },
        { id: PERSON_X },
        { pos: 1 },
        {},
        null,
    ];

    await App.scenario.runner.runGroup(Actions.setPos, data);
};

const del = async () => {
    setBlock('Delete persons', 2);

    const data = [
        { id: App.scenario.PERSON_Y },
    ];

    return App.scenario.runner.runGroup(Actions.del, data);
};

const delWithChainedRequest = async () => {
    setBlock('Delete persons with chained request', 2);

    const { PERSON_CHAINED_Z, PERSON_CHAINED_AA } = App.scenario;

    const data = [
        {
            id: [PERSON_CHAINED_Z, PERSON_CHAINED_AA],
            returnState: {
                persons: { visibility: 'all' },
                accounts: { visibility: 'all' },
            },
        },
    ];

    return App.scenario.runner.runGroup(Actions.del, data);
};

const delInvalid = async () => {
    setBlock('Delete persons with invalid data', 2);

    const data = [
        null,
        [],
        [null, null],
    ];

    return App.scenario.runner.runGroup(Actions.del, data);
};

export const apiPersonsTests = {
    async createTests() {
        await create();
        await createWithChainedRequest();
        await createInvalid();
        await createMultiple();
        await createMultipleWithChainedRequest();
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
