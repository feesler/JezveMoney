import { setBlock } from 'jezve-test';
import { App } from '../../Application.js';
import * as PersonApiTests from '../../run/api/person.js';

const create = async () => {
    const data = [{
        name: 'Person X',
        flags: 0,
    }, {
        name: 'Y',
        flags: 0,
    }, {
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

    [
        App.scenario.PERSON_X,
        App.scenario.PERSON_Y,
    ] = await App.scenario.runner.runGroup(PersonApiTests.create, data);
};

const createMultiple = async () => {
    setBlock('Create multiple', 3);

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

    const invData = [
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
    await App.scenario.runner.runGroup(PersonApiTests.createMultiple, invData);
};

const update = async () => {
    const data = [
        { id: App.scenario.PERSON_X, name: 'XX!' },
        // Try to update name of person to an existing one
        { id: App.scenario.PERSON_X, name: 'XX!' },
        { id: App.scenario.PERSON_X, name: '' },
    ];

    return App.scenario.runner.runGroup(PersonApiTests.update, data);
};

const del = async () => {
    const data = [
        [App.scenario.PERSON_Y],
        [],
    ];

    return App.scenario.runner.runGroup(PersonApiTests.del, data);
};

export const apiPersonsTests = {
    async createTests() {
        await create();
        await createMultiple();
    },

    async updateAndDeleteTests() {
        await update();
        await del();
    },
};
