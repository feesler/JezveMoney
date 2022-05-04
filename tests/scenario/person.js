import * as PersonTests from '../run/person.js';
import { setBlock } from '../env.js';

let scenario = null;

async function createTests() {
    setBlock('Create persons', 2);

    const data = [
        { name: '&&<div>' },
        { name: 'Alex' },
        { name: 'Maria' },
        { name: 'Johnny' },
        { name: 'Иван' },
        // Try to submit person with empty name
        { name: '' },
    ];

    await scenario.runner.runGroup(PersonTests.create, data);
}

async function updateTests() {
    setBlock('Update persons', 2);

    const data = [{
        pos: 4,
        name: 'Ivan<',
    }, {
        // Try to submit person with empty name
        pos: 0,
        name: '',
    }];

    await scenario.runner.runGroup(PersonTests.update, data);
}

async function deleteTests() {
    setBlock('Delete persons', 2);

    const data = [
        [0],
        [0, 2],
    ];

    await scenario.runner.runGroup(PersonTests.del, data);
}

async function deleteFromUpdateTests() {
    setBlock('Delete person from update view', 2);

    const data = [
        0,
    ];

    await scenario.runner.runGroup(PersonTests.delFromUpdate, data);
}

async function hideTests() {
    setBlock('Hide persons', 2);

    const data = [
        [0],
        [0, 1],
    ];

    await scenario.runner.runGroup(PersonTests.hide, data);
}

async function showTests() {
    setBlock('Show persons', 2);

    const data = [
        [2],
        [0, 4],
    ];

    await scenario.runner.runGroup(PersonTests.show, data);
}

async function toggleTests() {
    setBlock('Toggle select persons', 2);

    const data = [
        [0],
        [1, 2],
    ];

    await scenario.runner.runGroup(PersonTests.toggleSelect, data);
}

export const personTests = {
    /** Initialize tests */
    init(scenarioInstance) {
        scenario = scenarioInstance;
    },

    /** Run person view tests */
    async run() {
        setBlock('Persons', 1);

        await createTests();
        await hideTests();
        await toggleTests();
        await showTests();
        await updateTests();
        await deleteTests();
    },

    /** Run person view tests with transactions */
    async runPostTransaction() {
        await deleteFromUpdateTests();
    },

    /** Initialize and run tests */
    async initAndRun(scenarioInstance) {
        this.init(scenarioInstance);
        await this.run();
    },
};
