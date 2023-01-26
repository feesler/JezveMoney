import { setBlock } from 'jezve-test';
import { App } from '../../../Application.js';
import * as PersonApiTests from '../../../run/api/person.js';

const create = async () => {
    setBlock('Create persons', 2);

    const data = [{
        name: 'Person X',
        flags: 0,
    }, {
        name: 'Y',
        flags: 0,
    }];

    [
        App.scenario.PERSON_X,
        App.scenario.PERSON_Y,
    ] = await App.scenario.runner.runGroup(PersonApiTests.create, data);
};

const createInvalid = async () => {
    setBlock('Create persons with invalid data', 2);

    const data = [{
        // Try to create person with existing name
        name: 'Y',
        flags: 0,
    }, {
        // Invalid data tests
        flags: 0,
    }, {
        name: 'ZZZ',
    }, {
        name: '',
        flags: 1,
        xxx: 1,
    }, {
        name: '',
        flags: 1,
    }];

    await App.scenario.runner.runGroup(PersonApiTests.create, data);
};

const createMultiple = async () => {
    setBlock('Create multiple persons', 2);

    const data = [{
        name: 'Person 1',
        flags: 0,
    }, {
        name: 'Person 2',
        flags: 0,
    }, {
        name: 'Person 3',
        flags: 0,
    }];

    await PersonApiTests.createMultiple(data);
};

const createMultipleInvalid = async () => {
    setBlock('Create multiple persons with invalid data', 2);

    const data = [
        null,
        [null],
        [null, null],
        [{
            name: '',
            flags: 0,
        }, {
            name: 'Person 2',
            flags: 0,
        }],
        [{
            name: 'Person 4',
            flags: 0,
        }, null],
    ];

    await App.scenario.runner.runGroup(PersonApiTests.createMultiple, data);
};

const update = async () => {
    setBlock('Update persons', 2);

    const data = [
        { id: App.scenario.PERSON_X, name: 'XX!' },
    ];

    return App.scenario.runner.runGroup(PersonApiTests.update, data);
};

const updateInvalid = async () => {
    setBlock('Update persons with invalid data', 2);

    const data = [
        // Try to update name of person to an existing one
        { id: App.scenario.PERSON_X, name: 'XX!' },
        { id: App.scenario.PERSON_X, name: '' },
    ];

    return App.scenario.runner.runGroup(PersonApiTests.update, data);
};

const setPos = async () => {
    setBlock('Set position', 2);

    const { PERSON_X, PERSON_Y } = App.scenario;

    const data = [
        { id: PERSON_X, pos: 5 },
        { id: PERSON_Y, pos: 10 },
        { id: PERSON_X, pos: 1 },
    ];

    await App.scenario.runner.runGroup(PersonApiTests.setPos, data);
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

    await App.scenario.runner.runGroup(PersonApiTests.setPos, data);
};

const del = async () => {
    setBlock('Delete persons', 2);

    const data = [
        [App.scenario.PERSON_Y],
    ];

    return App.scenario.runner.runGroup(PersonApiTests.del, data);
};

const delInvalid = async () => {
    setBlock('Delete persons with invalid data', 2);

    const data = [
        null,
        [],
        [null, null],
    ];

    return App.scenario.runner.runGroup(PersonApiTests.del, data);
};

export const apiPersonsTests = {
    async createTests() {
        await create();
        await createInvalid();
        await createMultiple();
        await createMultipleInvalid();
    },

    async updateAndDeleteTests() {
        await update();
        await updateInvalid();
        await setPos();
        await setPosInvalid();
        await del();
        await delInvalid();
    },
};
