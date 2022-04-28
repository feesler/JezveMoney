import * as PersonTests from '../run/person.js';
import { setBlock } from '../env.js';

let scenario = null;

async function createPersonTests() {
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

async function updatePersonTests() {
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

async function deletePersonTests() {
    setBlock('Delete persons', 2);

    const data = [
        [0],
        [0, 2],
    ];

    await scenario.runner.runGroup(PersonTests.del, data);
}

async function hidePersonsTest() {
    setBlock('Hide persons', 2);

    const data = [
        [0],
        [0, 1],
    ];

    await scenario.runner.runGroup(PersonTests.hide, data);
}

async function showPersonsTest() {
    setBlock('Show persons', 2);

    const data = [
        [2],
        [0, 4],
    ];

    await scenario.runner.runGroup(PersonTests.show, data);
}

async function togglePersonsTest() {
    setBlock('Toggle select persons', 2);

    const data = [
        [0],
        [1, 2],
    ];

    await scenario.runner.runGroup(PersonTests.toggleSelect, data);
}

export async function personTests() {
    setBlock('Persons', 1);

    scenario = this;

    await createPersonTests();
    await hidePersonsTest();
    await togglePersonsTest();
    await showPersonsTest();
    await updatePersonTests();
    await deletePersonTests();
}
